# coding: UTF-8'
class DataImport < Sequel::Model
  include CartoDB::MiniSequel
  include ActiveModel::Validations

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
    self.values[:data_source] = data_source
    self.data_type = if File.exist?(Rails.root.join("public#{self.data_source}")) then 'file' else 'url' end
  end

  def after_create
    user = User[self.user_id]

    import_attributes = Rails::Sequel.configuration.environment_for(Rails.env).merge(
      :database        => user.database_name,
      :logger          => Rails.logger,
      :username        => user.database_username,
      :password        => user.database_password,
      :debug           => (Rails.env.development?),
      :remaining_quota => user.remaining_quota,
      :data_import_id  => id
    ).symbolize_keys

    if data_type == 'file'
      import_attributes[:import_from_file] = File.open(Rails.root.join("public#{self.data_source}"), 'r')
    else
      import_attributes[:import_from_url] = data_source
    end

    importer = CartoDB::Importer.new(import_attributes).import!

    self.reload
    self.imported
    self.table_name = importer.name
    self.save

    #import_cleanup
    #set_the_geom_column!

    self.formatted
    self.save
  end

  def after_rollback(*args, &block)
    self.save
    set_callback(:rollback, :after, *args, &block)
  end

  def updated_now(transition)
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
    CartoDB::IMPORTER_ERROR_CODES[self.error_code]
  end

  def log_json
    if self.logger.nil?
      ["empty"]
    else
      self.logger.split("\n")
    end
  end

end
