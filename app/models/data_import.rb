# coding: UTF-8'
class DataImport < Sequel::Model
  include CartoDB::MiniSequel
  include ActiveModel::Validations

  attr_accessor :append, :migrate_table, :table_copy, :from_query

  PUBLIC_ATTRIBUTES = %W{ id user_id table_id data_type table_name state success error_code queue_id get_error_text tables_created_count }

  def before_destroy
    # Remove uploaded file if present
    if file_sha = self.data_source.to_s.match(/uploads\/([a-z0-9]{20})\/.*/)
      path = Rails.root.join("public", "uploads", file_sha[1])
      FileUtils.rm_rf(path) if Dir.exists?(path)
    end
  end


  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  state_machine :initial => :preprocessing do
    before_transition :updated_now
    before_transition do
      self.save
    end

    after_transition :log_state_change
    #after_transition  :uploading => :preparing, :preparing => :importing, :importing => :cleaning do
    #end
    after_transition any => :complete do
      self.success = true
      self.logger << "SUCCESS!\n"
      self.save
    end
    after_transition any => :failure do
      self.success = false
      self.logger << "ERROR!\n"
      self.save
    end

    event :upload do |event|
      #the import is ready to start handling file upload
      transition :preprocessing => :uploading
    end
    event :download do |event|
      #the import is ready to start handling file download (url)
      transition :preprocessing => :downloading
    end
    event :migrate do |event|
      #the import is ready to start migration (query, table, other)
      transition :preprocessing => :migrating
    end

    event :file_ready do |event|
      transition [:uploading, :downloading] => :importing
    end

    #events for data import
    event :imported do
      transition :importing => :formatting
    end

    #events for data migration
    event :migrated do
      transition :migrating => :formatting
    end

    event :formatted do
      transition :formatting => :finishing
    end
    event :finished do
      transition :finishing => :complete
    end
    event :retry do
      transition any => same
    end
    event :failed do
      transition any => :failure
    end
  end


  def data_source=(data_source)
    if File.exist?(Rails.root.join("public#{data_source}"))
      self.values[:data_type] = 'file'
      self.values[:data_source] = Rails.root.join("public#{data_source}").to_s
    elsif Addressable::URI.parse(data_source).host.present?
      self.values[:data_type] = 'url'
      self.values[:data_source] = data_source
    end
  end

  def after_create
    begin
      if append.present?
        append_to_existing

      elsif migrate_table.present?
        migrate_existing migrate_table

      elsif table_copy.present? || from_query.present?
        # Raise an error if user is over table quota
        self.raise_error_if_over_quota 1

        query = table_copy ? "SELECT * FROM #{table_copy}" : from_query
        new_table_name = import_from_query table_name, query
        self.update :table_names => new_table_name
        migrate_existing new_table_name

      elsif %w(url file).include?(data_type)
        imports, errors = import_to_cartodb data_type, data_source
        if imports.present?
          imports.each do | import |
            migrate_existing import.name, table_name
          end
        end
      else
        failed!
      end

    rescue => e
      reload
      failed!
      # Add semantics based on the users creation method.
      # TODO: The importer should throw these specific errors
      if !e.is_a? CartoDB::QuotaExceeded
        e = CartoDB::InvalidUrl.new     e.message    if url?
        e = CartoDB::InvalidFile.new    e.message    if file?
        e = CartoDB::TableCopyError.new e.message    if table_copy?
      end
      CartoDB::Logger.info "Exception on tables#create", e.inspect
    end
  end

  def before_save
    self.updated_now
  end

  # FIXME: after a rollback the object doesn't exist on the
  # database anymore, so no save
  def after_rollback(*args, &block)
    #self.save
    #set_callback(:rollback, :after, *args, &block)
  end

  def updated_now(transition=nil)
    self.updated_at = Time.now
  end

  def log_update(update_msg)
    self.logger << "UPDATE: #{update_msg}\n"
    self.save
  end

  def log_error(error_msg)
    self.logger << "#{error_msg}\n"
    if self.error_code.nil?
      self.error_code = 99999
    end
    self.save
  end

  def log_warning(error_msg)
    self.logger << "WARNING: #{error_msg}\n"
    self.save
  end

  def log_state_change(transition)
    event, from, to = transition.event, transition.from_name, transition.to_name
    if !self.logger
      self.logger = "BEGIN \n"
      self.error_code = nil
    end
    self.logger << "TRANSITION: #{from} => #{to}, #{Time.now}\n"
  end

  def set_error_code(code)
    self.error_code = code
    self.save
  end

  def get_error_text
    self.error_code.blank? ? CartoDB::IMPORTER_ERROR_CODES[99999] : CartoDB::IMPORTER_ERROR_CODES[self.error_code]
  end

  def raise_error_if_over_quota number_of_tables
    if !current_user.remaining_table_quota.nil? && current_user.remaining_table_quota.to_i < number_of_tables
      self.set_error_code(8002)
      self.log_error("Over account table limit, please upgrade")
      raise CartoDB::QuotaExceeded, "More tables required"
    end
  end

  def log_json
    if self.logger.nil?
      ["empty"]
    else
      self.logger.split("\n")
    end
  end

  private

  def append_to_existing

    imports, errors = import_to_cartodb data_type, data_source
    # table_names is null, since we're just appending data to
    # an existing table, not creating a new one
    self.update :table_names => nil
    
    @table = Table.filter(:user_id => current_user.id, :id => table_id).first
    (imports || []).each do |import|
      migrate_existing import.name, table_name
      @new_table = Table.filter(:name => import.name).first
      @table.append_to_table(:from_table => @new_table)
      @table.save
      # append_to_table doesn't automatically destroy the table
      @new_table.destroy
    end

  end

  def import_to_cartodb method, import_source
    download if method == 'url'
    hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).symbolize_keys.merge(
      :database         => current_user.database_name,
      :logger           => ::Rails.logger,
      :username         => current_user.database_username,
      :password         => current_user.database_password,
      :import_from_file => import_source,
      :debug            => (Rails.env.development?),
      :remaining_quota  => current_user.remaining_quota,
      :remaining_tables => current_user.remaining_table_quota,
      :data_import_id   => id
    )
    importer = CartoDB::Importer.new hash_in
    importer, errors = importer.import!
    reload
    imported
    return importer, errors
  end

  def import_from_query name, query
    self.data_type = 'query'
    self.data_source = query
    self.save
    # ensure unique name
    uniname = get_valid_name(name)
    # create a table based on the query
    table_owner.in_database.run("CREATE TABLE #{uniname} AS #{query}")
    return uniname
  end

  def migrate_existing imported_name, name = nil

    new_name = imported_name || name

    #the below is redudant with the method below after import.nil?, should factor
    @new_table = Table.new
    @new_table.user_id = current_user.id
    @new_table.name = new_name

    @new_table.user_id =  user_id
    @new_table.data_import_id = id
    @new_table.migrate_existing_table = imported_name

    if @new_table.valid?
      @new_table.save
      @new_table.map.recalculate_bounds!
      refresh
    else
      reload
      CartoDB::Logger.info "Errors on import#create", @new_table.errors.full_messages
    end
  end

  def get_valid_name(raw_new_name = nil)
    # TODO add a delete table check in the cases where a table has become ghost
    # probably in the after_destroy method in table.rb

    # set defaults and sanity check
    raw_new_name = (raw_new_name || "untitled_table").sanitize

    # tables cannot be blank, start with numbers or underscore
    raw_new_name = "table_#{raw_new_name}" if raw_new_name =~ /^[0-9]/
    raw_new_name = "table#{raw_new_name}"  if raw_new_name =~ /^_/
    raw_new_name = "untitled_table"        if raw_new_name.blank?

    # Do a basic check for the new name. If it doesn't exist, let it through (sanitized)
    return raw_new_name if name_available?(raw_new_name)

    # Happens if we're duplicating a table.
    # First get candidates from the base name
    # eg: "simon_24" => "simon"
    if match = /(.+)_\d+$/.match(raw_new_name)
      raw_new_name = match[1]
    end

    # return if no dupe
    return raw_new_name if name_available?(raw_new_name)

    # increment trailing number (max+1) if dupe
    max_candidate = name_candidates(raw_new_name).sort_by {|c| -c[/_(\d+)$/,1].to_i}.first

    if max_candidate =~ /(.+)_(\d+)$/
      return $1 + "_#{$2.to_i + 1}"
    else
      return max_candidate + "_2"
    end
  end

  def name_available?(name)
    name_candidates(name).include?(name) ? false : name
  end

  def name_candidates(name)
    # FYI: Native sequel (table_owner.in_database.tables) filters tables that start with sql or pg
    table_owner.tables.filter(:name.like(/^#{name}/)).select_map(:name)
  end

  def table_owner
    table_owner ||= User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota).filter(:id => current_user.id).first
  end

  def current_user
    @current_user ||= User[user_id]
  end

  def table_name?
    table_name.present?
  end

  def file?
    data_type == 'file'
  end

  def url?
    data_type == 'url'
  end

  def table_copy?
    table_copy.present?
  end
end
