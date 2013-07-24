# encoding: UTF-8'
require 'sequel'
require 'fileutils'
require 'uuidtools'
require_relative './user'
require_relative './table'
require_relative '../../lib/cartodb/errors'
require_relative '../../lib/cartodb/metrics'
require_relative '../../lib/cartodb/github_reporter'
require_relative '../../lib/cartodb_stats'
require_relative '../../services/track_record/track_record/log'
require_relative '../../config/initializers/redis'
require_relative '../../services/importer/lib/importer'

class DataImport < Sequel::Model
  REDIS_LOG_KEY_PREFIX          = 'importer'
  REDIS_LOG_EXPIRATION_IN_SECS  = 3600 * 24 * 2 # 2 days

  attr_reader   :log

  PUBLIC_ATTRIBUTES = %W{ id user_id table_id data_type table_name state
    success error_code queue_id get_error_text tables_created_count }

  def after_initialize
    instantiate_log
    self.state ||= 'starting'
  end #after_initialize

  def before_save
    self.logger = self.log.id unless self.logger.present?
    self.updated_at = Time.now
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |attribute| [attribute, send(attribute)] }]
      .merge("queue_id" => id)
  end

  def run_import!
    success = !!dispatch
    success ? handle_success : handle_failure
    self
  rescue => exception
    reload
    handle_failure
    self.log << ("Exception while running import: " + exception.inspect)
    self
  end

  def set_error_code(code)
    self.error_code = code
    self.save
  end

  def get_error_text
    return CartoDB::IMPORTER_ERROR_CODES[99999] if self.error_code.blank? 
    return CartoDB::IMPORTER_ERROR_CODES[self.error_code]
  end

  def raise_error_if_over_quota(number_of_tables)
    if !current_user.remaining_table_quota.nil? && 
    current_user.remaining_table_quota.to_i < number_of_tables
      self.set_error_code(8002)
      self.log_error("Over account table limit, please upgrade")
      raise CartoDB::QuotaExceeded, "More tables required"
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

  def log_json
    return jsonize(self.log.to_s) if valid_uuid?(self.logger)
    return jsonize(self.logger.to_s)
  end #log_json

  def jsonize(text)
    return text.split("\n") if text.present?
    return ["empty"]
  end #jsonize

  def data_source=(data_source)
    if File.exist?(Rails.root.join("public#{data_source}"))
      self.values[:data_type] = 'file'
      self.values[:data_source] = Rails.root.join("public#{data_source}").to_s
    elsif Addressable::URI.parse(data_source).host.present?
      self.values[:data_type] = 'url'
      self.values[:data_source] = data_source
    end
  end

  def remove_uploaded_resources
    return nil unless uploaded_file

    path = Rails.root.join("public", "uploads", uploaded_file[1])
    FileUtils.rm_rf(path) if Dir.exists?(path)
  end #remove_uploaded_resources

  def handle_success
    CartodbStats.increment_imports
    self.success  = true
    self.state    = 'complete'
    self.log << "SUCCESS!\n"
    save
    CartoDB::Metrics.event("Import successful", metric_payload)
  end #handle_success

  def handle_failure
    CartodbStats.increment_failed_imports
    Rollbar.report_message("Failed import", "error", error_info: basic_information)
    CartoDB::Metrics.event("Import failed", metric_payload)
    CartoDB::GitHubReporter.new.report_failed_import(metric_payload)
    keep_problematic_file if uploaded_file

    self.success  = false
    self.state    = 'failure'
    self.log << "ERROR!\n"
    self.save
  end #handle_failure

  attr_reader :results

  def table
    Table.where(id: table_id, user_id: user_id).first
  end #table

  private

  attr_writer :results, :log

  def dispatch
    return append_to_existing if append.present?
    return migrate_existing   if migrate_table.present?
    return from_table         if table_copy.present? || from_query.present?
    return new_importer       
  end #dispatch

  def running_import_ids
    Resque::Worker.all.map do |worker|
      next unless worker.job["queue"] == "imports"
      worker.job["payload"]["args"].first["job_id"] rescue nil 
    end.compact
  end

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
    data_source ||= self.data_source
    downloader  = CartoDB::Importer2::Downloader.new(data_source)
    runner      = CartoDB::Importer2::Runner.new(pg_options, downloader)
    runner.run
    self.results = runner.results

    # table_names is null, since we're just appending data to
    # an existing table, not creating a new one
    self.update(table_names: nil)

    runner.results.each do |result|
      result.fetch(:tables).each do |new_table_name|
        #register(new_table_name, result.fetch(:name), result.fetch(:schema))
        #new_table = Table.where(name: new_table_name, user_id: current_user.id).first
        schema = result.fetch(:schema)
        table.append_from_importer(new_table_name, schema)
        table.save
        #new_table.destroy
      end
    end

    notify_failures(runner.results)
    success_status_from(runner.results)
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
    self.data_type    = 'query'
    self.data_source  = query
    self.save

    candidates =  table_owner.tables.select_map(:name)
    table_name = Table.get_valid_table_name(name, name_candidates: candidates)
    table_owner.in_database.run(%Q{CREATE TABLE #{table_name} AS #{query}})

    table_name
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

  def pg_options
    Rails.configuration.database_configuration[Rails.env].symbolize_keys
      .merge(
        user:     table_owner.database_username,
        password: table_owner.database_password,
        database: table_owner.database_name
      )
  end #pg_options

  def new_importer(data_source=nil)
    data_source ||= self.data_source
    downloader  = CartoDB::Importer2::Downloader.new(data_source)
    runner      = CartoDB::Importer2::Runner.new(pg_options, downloader)
    runner.run
    self.results = runner.results

    runner.results.each do |result|
      name        = result.fetch(:name)
      schema      = result.fetch(:schema)
      table_names = result.fetch(:tables)

      table_names.each { |table_name| register(table_name, name, schema) }
    end
   
    notify_failures(runner.results)
    success_status_from(runner.results)
  end #new_importer

  def notify_failures(results)
    results.select { |result| !result.fetch(:success) }
           .each   { |result| register_failed_import_event_for(result) }
  end #notify_failures

  def success_status_from(results)
    results.inject(true) { |memo, result| result.fetch(:success) && memo }
  end #success_status_from

  def register(table_name, name, schema='importer')
    current_user.in_database.execute(%Q{
      ALTER TABLE "#{schema}"."#{table_name}"
      SET SCHEMA public
    })

    candidates  = table_owner.tables.map(&:name)
    name        = Table.get_valid_table_name(name, name_candidates: candidates)

    current_user.in_database.execute(%Q{
      ALTER TABLE "public"."#{table_name}"
      RENAME TO #{name}
    })

    table                         = Table.new
    table.user_id                 = table_owner.id
    table.name                    = name
    table.migrate_existing_table  = name
    table.save

    self.table_id   = table.id
    self.table_name = table.name
    save
    table.optimize
    self
  end #register

  def register_failed_import_event_for(result)
    payload = {
      name:       result.fetch(:name),
      extension:  result.fetch(:extension)
    }
    CartoDB::Metrics.event("Import failed", payload)
  end #register_failed_import_event_for

  def table_owner
    table_owner ||= User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota).filter(:id => current_user.id).first
  end

  def from_table
    number_of_tables = 1
    raise_error_if_over_quota(number_of_tables)

    query = table_copy ? "SELECT * FROM #{table_copy}" : from_query
    new_table_name = import_from_query(table_name, query)
    self.update(table_names: new_table_name)
    migrate_existing(new_table_name)
  end

  def keep_problematic_file
    uploads_path  = Rails.root.join('public', 'uploads')
    file_path     = File.join(uploads_path, uploaded_file[1])
    vault_path    = File.join(uploads_path, failed_imports)

    return unless Dir.exists?(file_path)
    FileUtils.cp_r(file_path, vault_path)
  end #keep_problematic_file

  def metric_payload
    { distinct_id: current_user.username }.merge(basic_information)
  end #metric_payload

  def current_user
    @current_user ||= User[user_id]
  end
end

