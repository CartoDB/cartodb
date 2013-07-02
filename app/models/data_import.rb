# encoding: UTF-8'
require 'sequel'
require 'active_model'
require 'fileutils'
require 'uuidtools'
require_relative './user'
require_relative './table'
require_relative '../../lib/cartodb/errors'
require_relative '../../lib/cartodb_stats'
require_relative '../../lib/cartodb/mini_sequel'
#require_relative '../../lib/importer/lib/cartodb-importer'
require_relative '../../services/track_record/track_record/log'
require_relative '../../config/initializers/redis'
require_relative '../../services/importer/importer'

class DataImport < Sequel::Model
  include CartoDB::MiniSequel
  include ActiveModel::Validations

  REDIS_LOG_KEY_PREFIX          = 'importer'
  REDIS_LOG_EXPIRATION_IN_SECS  = 3600 * 24 * 2 # 2 days

  attr_reader   :log

  PUBLIC_ATTRIBUTES = %W{ id user_id table_id data_type table_name state
    success error_code queue_id get_error_text tables_created_count }

  def after_initialize
    instantiate_log
  end #after_initialize

  def before_save
    self.logger = self.log.id unless self.logger.present?
    updated_now
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |attribute| [attribute, send(attribute)] }]
      .merge("success" => success_value, "queue_id" => id)
  end

  def run_import!
    success = !!dispatch
    finished! if success
    failed!   unless success
    self
  rescue => exception
    reload
    failed!
    self.log << ("Exception while running import: " + exception.inspect)
    self
  end

  def log_update(update_msg)
    self.log << "UPDATE: #{update_msg}\n"
    self.save
  end

  def log_error(error_msg)
    self.log << "#{error_msg}\n"
    self.error_code = 99999 if self.error_code.nil?
    self.save
  end

  def log_warning(error_msg)
    self.log << "WARNING: #{error_msg}\n"
    self.save
  end

  def log_state_change(transition)
    event, from, to = transition.event, transition.from_name, transition.to_name
    if !self.logger
      self.log << "BEGIN \n"
      self.error_code = nil
    end
    self.log << "TRANSITION: #{from} => #{to}"
  end

  def set_error_code(code)
    self.error_code = code
    self.save
  end

  def get_error_text
    return CartoDB::IMPORTER_ERROR_CODES[99999] if self.error_code.blank? 
    return CartoDB::IMPORTER_ERROR_CODES[self.error_code]
  end

  def log_json
    return jsonize(self.log.to_s) if valid_uuid?(self.logger)
    return jsonize(self.logger.to_s)
  end #log_json

  def raise_error_if_over_quota(number_of_tables)
    if !current_user.remaining_table_quota.nil? && 
    current_user.remaining_table_quota.to_i < number_of_tables
      self.set_error_code(8002)
      self.log_error("Over account table limit, please upgrade")
      raise CartoDB::QuotaExceeded, "More tables required"
    end
  end

  def remove_uploaded_resources
    return nil unless uploaded_file

    path = Rails.root.join("public", "uploads", uploaded_file[1])
    FileUtils.rm_rf(path) if Dir.exists?(path)
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

  def mark_as_failed_if_stuck!    
    return false unless stuck?

    self.failed!
    CartoDB::notify_exception(
      CartoDB::GenericImportError.new("Import timed out"), 
      user: current_user
    )
    return true
  end

  private

  attr_writer :log

  def dispatch
    return append_to_existing if append.present?
    return migrate_existing   if migrate_table.present?
    return from_table         if table_copy.present? || from_query.present?
    return new_importer       if %w(url file).include?(data_type)
  end #dispatch

  def running_import_ids
    Resque::Worker.all.map do |worker|
      next unless worker.job["queue"] == "imports"
      worker.job["payload"]["args"].first["job_id"] rescue nil 
    end.compact
  end

  def success_value
    return false  if state == 'failure'
    return true   if state == 'complete'
    nil
  end #success_value

  def basic_information
    {
      error:         get_error_text[:title],
      username:      current_user.username,
      file_url:      public_url,
      account_type:  current_user.account_type,
      database:      current_user.database_name,
      email:         current_user.email
    }
  end

  def public_url
    return data_source unless uploaded_file
    "https://#{current_user.username}.cartodb.com/#{uploaded_file[0]}"
  end

  def jsonize(text)
    return text.split("\n") if text.present?
    return ["empty"]
  end #jsonize

  def valid_uuid?(text)
    !!UUIDTools::UUID.parse(text)
  rescue TypeError => exception
    false
  rescue ArgumentError => exception
    false
  end #instantiate_log

  def before_destroy
    self.remove_uploaded_resources
  end

  def updated_now(transition=nil)
    self.updated_at = Time.now
  end

  def instantiate_log
    uuid = self.logger

    if valid_uuid?(uuid)
      self.log  = TrackRecord::Log.new(
        id:         uuid.to_s, 
        prefix:     REDIS_LOG_KEY_PREFIX,
        expiration: REDIS_LOG_EXPIRATION_IN_SECS
      ).fetch 
    else
      self.log  = TrackRecord::Log.new(
        prefix:     REDIS_LOG_KEY_PREFIX,
        expiration: REDIS_LOG_EXPIRATION_IN_SECS
      )
    end
  end #instantiate_log
  
  def uploaded_file
    data_source.to_s.match(/uploads\/([a-z0-9]{20})\/.*/)
  end

  # A stuck job shouldn't be finished, so it's state should not
  # be 'complete' nor 'failed'. It should have been in the queue
  # for more than 5 minutes and it shouldn't be currently
  # processed by any active worker
  def stuck?
    !['complete', 'failure'].include?(self.state) &&
    self.created_at < 5.minutes.ago               &&
    !running_import_ids.include?(self.id)
  end

  def append_to_existing
    imports, errors = import_to_cartodb(data_type, data_source)
    # table_names is null, since we're just appending data to
    # an existing table, not creating a new one
    self.update :table_names => nil

    @table = Table.filter(:user_id => current_user.id, :id => table_id).first
    (imports || []).each do |import|
      migrate_existing(import.name, table_name)
      @new_table = Table.filter(:name => import.name).first
      @table.append_to_table(:from_table => @new_table)
      @table.save
      # append_to_table doesn't automatically destroy the table
      @new_table.destroy
    end
  end

  def import_to_cartodb(method, import_source)
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
      :data_import_id   => id,
      :osm2pgsql_port   => Cartodb.config[:importer]["osm2pgsql_port"]
    )
    importer = CartoDB::Importer.new hash_in
    importer, errors = importer.import!
    reload
    imported
    return importer, errors
  end

  def import_from_query(name, query)
    self.data_type = 'query'
    self.data_source = query
    self.save
    # ensure unique name
    uniname = get_valid_name(name)
    # create a table based on the query
    table_owner.in_database.run("CREATE TABLE #{uniname} AS #{query}")
    return uniname
  end

  def migrate_existing(imported_name=migrate_table, name=nil)
    new_name = imported_name || name

    @new_table = Table.new
    @new_table.user_id = user_id
    @new_table.name = new_name
    @new_table.data_import_id = id
    @new_table.migrate_existing_table = imported_name

    if @new_table.valid?
      @new_table.save
      @new_table.optimize
      @new_table.map.recalculate_bounds!
      # check if the table fits into owner's remaining quota
      if table_owner.remaining_quota < 0
        self.log_error("Over storage quota, removing table" )
        self.set_error_code(8001)
        @new_table.destroy
        return false
      end
      refresh
      return true
    else
      reload
      self.log << ("Error linking #{imported_name} to UI: " + @new_table.errors.full_messages.join(" - "))
      return false
    end
  end

  def proper_import
    success = false
    imports, errors = import_to_cartodb(data_type, data_source)

    if imports.present?
      imports.each do | import |
        self.log << "Linking #{import.name} to CartoDB UI"
        unless migrate_existing(import.name, table_name)
          current_user.in_database.drop_table(import.name) rescue ""
        else
          success = true
        end
      end
    end

    success
  end

  def new_importer
    downloader  = CartoDB::Importer::Downloader.new(data_source)
    runner      = CartoDB::Importer::Runner.new(job, downloader)
    runner.run
    runner.exit_code == 0
  end #new_importer

  def get_valid_name(name)
    Table.get_valid_table_name(name, 
      name_candidates: table_owner.tables.select_map(:name))
  end

  def table_owner
    table_owner ||= User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota).filter(:id => current_user.id).first
  end

  def current_user
    @current_user ||= User[user_id]
  end

  #def table_name?
  #  !table_name.nil? && !table_name.empty?
  #end

  def file?
    data_type == 'file'
  end

  def url?
    data_type == 'url'
  end

  def table_copy?
    table_copy.present?
  end

  def from_table
    number_of_tables = 1
    raise_error_if_over_quota(number_of_tables)

    query = table_copy ? "SELECT * FROM #{table_copy}" : from_query
    new_table_name = import_from_query(table_name, query)
    self.update(table_names: new_table_name)
    migrate_existing(new_table_name)
  end

  state_machine :initial => :preprocessing do
    before_transition :updated_now
    before_transition do
      self.save
    end

    after_transition :log_state_change

    after_transition any => :complete do
      CartodbStats.increment_imports()
      self.success = true
      self.log << "SUCCESS!\n"
      save
    end

    after_transition any => :failure do
      # Increment failed imports on CartoDB stats
      CartodbStats.increment_failed_imports()
      Rollbar.report_message("Failed import", "error", error_info: basic_information)

      # Copy any uploaded resources to secret failed imports vault(tm)
        
      if uploaded_file
        path = Rails.root.join("public", "uploads", uploaded_file[1])
        FileUtils.cp_r(path, Rails.root.join('public', 'uploads', 'failed_imports')) if Dir.exists?(path)
      end

      self.success = false
      self.log << "ERROR!\n"
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

end
