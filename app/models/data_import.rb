require 'sequel'
require 'fileutils'
require_relative './user'
require_relative './table'
require_relative './visualization/member'
require_relative './table_registrar'
require_relative './quota_checker'
require_relative '../../lib/cartodb/errors'
require_relative '../../lib/cartodb/import_error_codes'
require_relative '../../lib/cartodb/metrics'
require_relative '../../lib/cartodb/stats/importer'
require_relative '../../config/initializers/redis'
require_relative '../../services/importer/lib/importer'
require_relative '../connectors/importer'
require_relative '../../services/importer/lib/importer/datasource_downloader'
require_relative '../../services/datasources/lib/datasources'
require_relative '../../services/importer/lib/importer/unp'
require_relative '../../services/importer/lib/importer/post_import_handler'
require_relative '../../services/importer/lib/importer/mail_notifier'
require_relative '../../services/importer/lib/importer/cartodbfy_time'
require_relative '../../services/platform-limits/platform_limits'
require_relative '../../services/importer/lib/importer/overviews'
require_relative '../../services/importer/lib/importer/connector_runner'
require_relative '../../services/importer/lib/importer/exceptions'
require_relative '../../services/importer/lib/importer/column'

require_dependency 'carto/tracking/events'
require_dependency 'carto/valid_table_name_proposer'
require_dependency 'carto/configuration'
require_dependency 'carto/db/user_schema'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/helpers/data_import_commons'

include CartoDB::Datasources

class DataImport < Sequel::Model
  include Carto::DataImportConstants
  include Carto::Configuration
  include Carto::UUIDHelper
  include Carto::DataImportCommons

  MERGE_WITH_UNMATCHING_COLUMN_TYPES_RE = /No .*matches.*argument type.*/
  DIRECT_STATEMENT_TIMEOUT = 1.hour * 1000

  attr_accessor   :log, :results

  many_to_one :user

  # Not all constants are used, but so that we keep track of available states
  STATE_ENQUEUED  = 'enqueued'  # Default state for imports whose files are not yet at "import source"
  STATE_PENDING   = 'pending'   # Default state for files already at "import source" (e.g. S3 bucket)
  STATE_UNPACKING = 'unpacking'
  STATE_IMPORTING = 'importing'
  STATE_COMPLETE  = 'complete'
  STATE_UPLOADING = 'uploading'
  STATE_FAILURE   = 'failure'
  STATE_STUCK     = 'stuck'

  TYPE_EXTERNAL_TABLE = 'external_table'
  TYPE_FILE           = 'file'
  TYPE_URL            = 'url'
  TYPE_QUERY          = 'query'
  TYPE_DATASOURCE     = 'datasource'

  def after_initialize
    instantiate_log
    self.results  = []
    self.state    ||= STATE_PENDING
  end

  # This before_create should be only necessary to track old dashboard data imports.
  # New ones are already tracked during the data_import create inside the controller
  # For the old dashboard
  def before_create
    if from_common_data?
      self.extra_options = extra_options.merge(common_data: true)
    end
    self.extra_options = extra_options.merge(column_sanitization_version: CartoDB::Importer2::Column::CURRENT_COLUMN_SANITIZATION_VERSION)
  end

  def before_save
    unless logger.present?
      log.save
      self.logger = log.id
    end
    self.updated_at = Time.now
  end

  # The objective of this after_create method is to track in the logs every started
  # import process.
  def after_create
    notify(results)
  end

  def from_common_data?
    username = Cartodb.get_config(:common_data, 'username')
    host = Cartodb.get_config(:common_data, 'host')
    if username && host &&
       !extra_options.has_key?('common_data') &&
       data_source && data_source.include?("#{username}.#{host}")
      return true
    end

    false
  end

  def extra_options
    return {} if self.import_extra_options.nil?
    ::JSON.parse(self.import_extra_options).symbolize_keys
  end

  def extra_options=(value)
    if !value.nil?
      self.import_extra_options = ::JSON.dump(value)
    end
  end

  def dataimport_logger
    @@dataimport_logger ||= CartoDB.unformatted_logger(log_file_path("imports.log"))
  end

  def run_import!
    self.resque_ppid = Process.ppid
    self.server = Socket.gethostname
    log.append("Running on server #{server} with PID: #{Process.pid}")

    begin
      self.state = STATE_UPLOADING

      success = if table_copy.present? || from_query.present?
                  from_table
                elsif service_name == 'connector'
                  !!execute_importer(*new_importer_with_connector)
                else
                  !!execute_importer(*new_importer)
                end
    rescue TokenExpiredOrInvalidError => ex
      success = false
      begin
        current_user.oauths.remove(ex.service_name)
      rescue StandardError => ex2
        log.append("Exception removing OAuth: #{ex2.message}")
        log.append(ex2.backtrace)
      end
    end

    log.append('After dispatch')

    if results.empty?
      if collision_strategy == COLLISION_STRATEGY_SKIP
        self.error_code = 1022
        self.state = STATE_COMPLETE
      else
        self.error_code = 1002
        self.state = STATE_FAILURE
      end
      save
    end

    self.cartodbfy_time = CartoDB::Importer2::CartodbfyTime::instance(id).get
    success ? handle_success : handle_failure
    log.store
    Rails.logger.debug log.to_s

    self
  rescue CartoDB::QuotaExceeded => quota_exception
    current_user_id = current_user.id
    Carto::Tracking::Events::ExceededQuota.new(current_user_id, user_id: current_user_id).report

    CartoDB::notify_warning_exception(quota_exception)
    handle_failure(quota_exception)
    self
  rescue CartoDB::CartoDBfyInvalidID
    invalid_cartodb_id_exception = CartoDB::Importer2::CartoDBfyInvalidID.new
    log.append("Exception: #{invalid_cartodb_id_exception}")
    CartoDB::notify_warning_exception(invalid_cartodb_id_exception)
    handle_failure(invalid_cartodb_id_exception)
    self
  rescue Carto::UnauthorizedError => e
    log.append("Exception: #{e.message}")
    log.append(e.backtrace, false)
    stacktrace = e.message + e.backtrace.join
    CartoDB.report_exception(e, 'Map quota exceeded', error_info: stacktrace)
    error = CartoDB::Importer2::MapQuotaExceededError.new
    handle_failure(error)
    raise error
  rescue StandardError => exception
    log.append("Exception: #{exception.to_s}")
    log.append(exception.backtrace, false)
    stacktrace = exception.to_s + exception.backtrace.join
    CartoDB.report_exception(exception, 'Import error', error_info: stacktrace)
    handle_failure(exception)
    raise exception
    self
  end

  def get_error_source
    if self.error_code == CartoDB::NO_ERROR_CODE
      CartoDB::NO_ERROR_CODE
    else
      self.error_code.blank? ? CartoDB::IMPORTER_ERROR_CODES[99999][:source] : CartoDB::IMPORTER_ERROR_CODES[self.error_code][:source]
    end
  end

  def raise_over_table_quota_error
    log.append('Over account table limit, please upgrade')
    self.error_code = 8002
    self.state      = STATE_FAILURE
    save
    raise CartoDB::QuotaExceeded, 'More tables required'
  end

  # TODO: move to new model
  def mark_as_failed_if_stuck!
    return false unless stuck?

    log.append("Import timed out. Id:#{self.id} State:#{self.state} Created at:#{self.created_at} Running imports:#{running_import_ids}")

    handle_failure(CartoDB::Importer2::StuckImportJobError.new)

    CartoDB::notify_exception(
      CartoDB::Importer2::GenericImportError.new('Import timed out or got stuck'),
      user: current_user
    )
    true
  end

  def data_source=(data_source)
    if data_source.nil?
      values[:data_type] = TYPE_DATASOURCE
      values[:data_source] = ''
    elsif self.data_type != TYPE_QUERY
      begin
        path = uploaded_file_path(data_source)
        if File.exist?(path) && !File.directory?(path)
          values[:data_type] = TYPE_FILE
          values[:data_source] = path
        elsif Addressable::URI.parse(data_source).host.present?
          values[:data_type] = TYPE_URL
          values[:data_source] = data_source
        end
      rescue Addressable::URI::InvalidURIError
        # this should only happen in testing, but just in case capture and log
        log_warning(message: 'InvalidURIError when processing data_source', data_source: data_source)
      end
    end

    self.original_url = self.values[:data_source] if (self.original_url.to_s.length == 0)

    # else SQL-based import
  end

  def remove_uploaded_resources
    return nil unless uploaded_file

    file_upload_helper = CartoDB::FileUpload.new(Cartodb.get_config(:importer, 'uploads_path'))
    path = file_upload_helper.get_uploads_path.join(uploaded_file[1])
    FileUtils.rm_rf(path) if Dir.exists?(path)
  end

  def handle_success
    self.success  = true
    self.state    = STATE_COMPLETE
    table_names = results.map { |result| result.name }.select { |name| name != nil}.sort
    self.table_names = table_names.join(' ')
    self.tables_created_count = table_names.size
    log.append("Import finished\n")
    log.store
    save

    begin
      CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount.new({
                                                                             user: current_user,
                                                                             redis: {
                                                                               db: $users_metadata
                                                                             }
                                                                         })
                                                                    .decrement!
    rescue StandardError => exception
      log_info('Error decreasing concurrent import limit', exception: exception)
    end
    notify(results, id)

    self
  end

  def handle_failure(supplied_exception = nil)
    self.success    = false
    self.state      = STATE_FAILURE
    if !supplied_exception.nil? && supplied_exception.respond_to?(:error_code)
      self.error_code = supplied_exception.error_code
    end
    log.append("ERROR!\n")
    log.store
    self.save
    begin
      CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount.new({
                                                                           user: current_user,
                                                                           redis: {
                                                                             db: $users_metadata
                                                                           }
                                                                         })
      .decrement!
    rescue StandardError => exception
      log_info('Error decreasing concurrent import limit', exception: exception)
    end
    notify(results)
    self
  rescue StandardError => exception
    log.append("Exception: #{exception.to_s}")
    log.append(exception.backtrace, false)
    log.store
    self
  end

  # Calculates the maximum timeout in seconds for a given user, to be used when performing HTTP requests
  # TODO: Candidate for being private if we join syncs and data imports someday
  # TODO: Add timeout config (if we need to change this)
  def self.http_timeout_for(user, assumed_kb_sec = 75*1024)
    if user.nil? || !user.respond_to?(:quota_in_bytes)
      raise ArgumentError.new('Need a User object to calculate its download speed')
    end

    if assumed_kb_sec < 1
      raise ArgumentError.new('KB per second must be > 0')
    end

    (user.quota_in_bytes / assumed_kb_sec).round
  end

  def validate
    super
    errors.add(:user, "Viewer users can't create data imports") if user && user.viewer
    validate_collision_strategy
  end

  def final_state?
    [STATE_COMPLETE, STATE_FAILURE, STATE_STUCK].include?(state)
  end

  def column_sanitization_version
    extra_options[:column_sanitization_version] || CartoDB::Importer2::Column::INITIAL_COLUMN_SANITIZATION_VERSION
  end

  private

  def get_provider_name_from_id(service_item_id)
    begin
      connector_params = JSON.parse(service_item_id)
      return connector_params['provider']
    rescue StandardError
      return nil
    end
  end

  def running_import_ids
    Resque::Worker.all.map do |worker|
      next unless worker.job['queue'] == 'imports'
      worker.job['payload']['args'].first['job_id'] rescue nil
    end.compact
  end

  def public_url
    return data_source unless uploaded_file
    "https://#{current_user.username}.carto.com/#{uploaded_file[0]}"
  end

  def before_destroy
    self.remove_uploaded_resources
  end

  def instantiate_log
    uuid = logger

    self.log = if uuid?(uuid)
                 Carto::Log.find(uuid.to_s)
               else
                 Carto::Log.new_data_import(user_id)
               end
  end

  def uploaded_file
    data_source.to_s.match(/uploads\/([a-z0-9]{20})\/.*/)
  end

  # A stuck job should've started but not be finished, so it's state should not be complete nor failed, it should
  # have been in the queue for more than 5 minutes and it shouldn't be currently processed by any active worker
  def stuck?
    state == STATE_STUCK ||
      ![STATE_ENQUEUED, STATE_PENDING, STATE_COMPLETE, STATE_FAILURE].include?(state) &&
        created_at < 5.minutes.ago &&
        !running_import_ids.include?(id)
  end

  def from_table
    log.append('from_table()')

    number_of_tables = 1
    quota_checker = CartoDB::QuotaChecker.new(current_user)
    if quota_checker.will_be_over_table_quota?(number_of_tables)
      raise_over_table_quota_error
    end

    query = table_copy ? "SELECT * FROM #{table_copy}" : from_query
    new_table_name = import_from_query(table_name, query)
    return true unless new_table_name && !overwrite_strategy?

    sanitize_columns(new_table_name)

    self.update(table_names: new_table_name, service_name: nil)
    migrate_existing(new_table_name)

    self.results.push CartoDB::Importer2::Result.new(success: true, error: nil)
  rescue Sequel::DatabaseError => exception
    if exception.to_s =~ MERGE_WITH_UNMATCHING_COLUMN_TYPES_RE
      set_merge_error(8004, exception.to_s)
    else
      set_merge_error(8003, exception.to_s)
    end
    false
  end

  def import_from_query(name, query)
    log.append('import_from_query()')

    self.data_type    = TYPE_QUERY
    self.data_source  = query
    save

    taken_names = Carto::Db::UserSchema.new(current_user).table_names

    if taken_names.include?(name) && collision_strategy == Carto::DataImportConstants::COLLISION_STRATEGY_SKIP
      log.append("Table with name #{name} already exists. Skipping")
      return
    end

    table_name = Carto::ValidTableNameProposer.new.propose_valid_table_name(name, taken_names: taken_names)

    if overwrite_strategy?
      overwrite_table_from_query(table_name, name, query)
      results.push CartoDB::Importer2::Result.new(success: true, error: nil)
    else
      current_user.db_service.in_database_direct_connection(
        statement_timeout: DIRECT_STATEMENT_TIMEOUT
      ) do |user_direct_conn|
        user_direct_conn.run(%{CREATE TABLE #{table_name} AS #{query}})
      end
    end
    if current_user.over_disk_quota?
      log.append("Over storage quota. Dropping table #{table_name}")
      current_user.in_database.run(%{DROP TABLE #{table_name}})
      self.error_code = 8001
      self.state      = STATE_FAILURE
      save
      raise CartoDB::QuotaExceeded, 'More storage required'
    end

    table_name
  end

  def overwrite_table_from_query(new_table_name, overwrite_table_name, query)
    importer = new_importer_with_unused_runner
    importer.overwrite_register(
      CartoDB::Importer2::Result.new(tables: [new_table_name]),
      overwrite_table_name
    ) do |database, schema|
      database.execute(%{CREATE TABLE #{new_table_name} AS #{query}})
      importer.drop("\"#{schema}\".\"#{overwrite_table_name}\"")
      database.execute(%{
        ALTER TABLE "#{schema}"."#{new_table_name}" RENAME TO "#{overwrite_table_name}"
      })
    end
  end

  def overwrite_strategy?
    collision_strategy == Carto::DataImportConstants::COLLISION_STRATEGY_OVERWRITE
  end


  def sanitize_columns(table_name)
    # TODO: is this called before table is registered? otherwise we should use Table#sanitize_columns
    Table.sanitize_columns(
      table_name,
      column_sanitization_version,
      {
        connection: current_user.in_database,
        database_schema: current_user.database_schema
      }
    )
  end

  def migrate_existing(imported_name)
    log.append('migrate_existing()')

    table         = ::Table.new
    table.user_id = user_id
    table.name    = imported_name
    table.migrate_existing_table = imported_name
    table.data_import_id = self.id

    if table.valid?
      log.append('Table valid')
      table.save
      table.optimize
      table.map.recalculate_bounds!
      if current_user.remaining_quota < 0
        log.append('Over storage quota, removing table')
        self.error_code = 8001
        self.state      = STATE_FAILURE
        save
        table.destroy
        raise CartoDB::QuotaExceeded, 'More storage required'
      end
      refresh
      self.table_id = table.id
      self.table_name = table.name
      log.append("Table '#{table.name}' registered")
      save
      true
    else
      reload
      log.append("Table invalid: Error linking #{imported_name} to UI: " + table.errors.full_messages.join(' - '))
      false
    end
  end

  def pg_options
    SequelRails.configuration.environment_for(Rails.env)
      .merge(
        username: current_user.database_username,
        password: current_user.database_password,
        database: current_user.database_name,
        host:     current_user.database_host
      ) {|key, o, n| n.nil? || n.empty? ? o : n}
  end

  def ogr2ogr_options
    options = Cartodb.config.fetch(:ogr2ogr, {})
    if options['binary'].nil? || options['csv_guessing'].nil?
      {}
    else
      ogr_options = {
        ogr2ogr_binary:         options['binary'],
        ogr2ogr_csv_guessing:   options['csv_guessing'] && self.type_guessing,
        quoted_fields_guessing: self.quoted_fields_guessing
      }
      if options['memory_limit'].present?
        ogr_options.merge!(ogr2ogr_memory_limit: options['memory_limit'])
      end
      return ogr_options
    end
  end

  def content_guessing_options
    guessing_config = Cartodb.config.fetch(:importer, {}).deep_symbolize_keys.fetch(:content_guessing, {})
    geocoder_config = Cartodb.config.fetch(:geocoder, {}).deep_symbolize_keys
    if guessing_config[:enabled] and self.content_guessing and geocoder_config
      { guessing: guessing_config, geocoder: geocoder_config }
    else
      { guessing: { enabled: false } }
    end
  end

  # Create an Importer object (using a Runner to fetch the data).
  # This methods returns an array with four elements:
  # * importer: the new importer (nil if download errors detected)
  # * runner: the runner that the importer uses
  # * datasource_provider: the DataSource used
  # * manual_fields: error code and log in case of errors
  def new_importer
    manual_fields = {}
    had_errors = false
    log.append('new_importer()')

    datasource_provider = get_datasource_provider

    # If retrieving metadata we get an error, fail early
    begin
      downloader = get_downloader(datasource_provider)
    rescue DataDownloadError => ex
      had_errors = true
      manual_fields = {
        error_code: 1012,
        log_info: ex.to_s
      }
    rescue ExternalServiceError => ex
      had_errors = true
      manual_fields = {
        error_code: 1012,
        log_info: ex.to_s
      }
    rescue ExternalServiceTimeoutError => ex
      had_errors = true
      manual_fields = {
        error_code: 1020,
        log_info: ex.to_s
      }
    rescue DataDownloadTimeoutError => ex
      had_errors = true
      manual_fields = {
        error_code: 1020,
        log_info: ex.to_s
      }
    rescue ResponseError => ex
      had_errors = true
      manual_fields = {
        error_code: 1011,
        log_info: ex.to_s
      }
    rescue InvalidServiceError => ex
      had_errors = true
      manual_fields = {
        error_code: 1013,
        log_info: ex.to_s
      }
    rescue InvalidInputDataError => ex
      had_errors = true
      manual_fields = {
        error_code: 1012,
        log_info: ex.to_s
      }
    rescue UnsupportedOperationError => ex
      had_errors = true
      manual_fields = {
        error_code: 1023,
        log_info: ex.to_s
      }
    rescue CartoDB::Importer2::FileTooBigError => ex
      had_errors = true
      manual_fields = {
        error_code: ex.error_code,
        log_info: CartoDB::IMPORTER_ERROR_CODES[ex.error_code]
      }
    rescue StandardError => ex
      had_errors = true
      manual_fields = {
        error_code: 99999,
        log_info: ex.to_s
      }
    end

    if had_errors
      importer = runner = datasource_provider = nil
    else
      post_import_handler = CartoDB::Importer2::PostImportHandler.new
      case datasource_provider.class::DATASOURCE_NAME
        when Url::ArcGIS::DATASOURCE_NAME
          post_import_handler.add_fix_geometries_task
        when Search::Twitter::DATASOURCE_NAME
          post_import_handler.add_transform_geojson_geom_column
      end

      database_options = pg_options
      self.host = database_options[:host]

      unp = CartoDB::Importer2::Unp.new(Cartodb.config[:importer], Cartodb.config[:ogr2ogr])

      importer, runner = new_importer_with_runner(downloader, unp, post_import_handler)
    end

    [importer, runner, datasource_provider, manual_fields]
  end

  # Create an Importer using a ConnectorRunner to fetch the data.
  # This methods returns an array with two elements:
  # * importer: the new importer (nil if download errors detected)
  # * connector: the connector that the importer uses
  def new_importer_with_connector
    provider_name = get_provider_name_from_id(service_item_id)
    CartoDB::Importer2::ConnectorRunner.check_availability!(current_user, provider_name)

    database_options = pg_options

    self.host = database_options[:host]

    connector = CartoDB::Importer2::ConnectorRunner.new(
      service_item_id,
      user: current_user,
      pg: database_options,
      log: log,
      collision_strategy: collision_strategy
    )

    registrar     = CartoDB::TableRegistrar.new(current_user, ::Table)
    quota_checker = CartoDB::QuotaChecker.new(current_user)
    database      = current_user.in_database
    destination_schema = current_user.database_schema
    public_user_roles = current_user.db_service.public_user_roles
    overviews_creator = CartoDB::Importer2::Overviews.new(connector, current_user)
    importer = CartoDB::Connector::Importer.new(
      runner: connector,
      table_registrar: registrar,
      quota_checker: quota_checker,
      database: database,
      data_import_id: id,
      overviews_creator: overviews_creator,
      destination_schema: destination_schema,
      public_user_roles: public_user_roles
    )
    [importer, connector, nil, nil]
  end

  # Create an Importer object (using a Runner to fetch the data).
  # This methods returns an array with two elements:
  # * importer: the new importer (nil if download errors detected)
  # * runner: the runner that the importer uses
  def new_importer_with_runner(downloader, unpacker, post_import_handler)
    runner = CartoDB::Importer2::Runner.new(
      pg: pg_options,
      downloader: downloader,
      log: log,
      user: user,
      unpacker: unpacker,
      post_import_handler: post_import_handler,
      importer_config: Cartodb.config[:importer],
      collision_strategy: collision_strategy
    )

    runner.loader_options = ogr2ogr_options.merge content_guessing_options
    runner.set_importer_stats_host_info(Socket.gethostname)
    registrar = CartoDB::TableRegistrar.new(current_user, ::Table)
    quota_checker = CartoDB::QuotaChecker.new(current_user)
    database = current_user.in_database
    destination_schema = current_user.database_schema
    public_user_roles = current_user.db_service.public_user_roles
    overviews_creator = CartoDB::Importer2::Overviews.new(runner, current_user)
    importer = CartoDB::Connector::Importer.new(
      runner: runner,
      table_registrar: registrar,
      quota_checker: quota_checker,
      database: database,
      data_import_id: id,
      overviews_creator: overviews_creator,
      destination_schema: destination_schema,
      public_user_roles: public_user_roles,
      collision_strategy: collision_strategy
    )

    [importer, runner]
  end

  # Create an Importer object with a runner that it's not able to fetch data.
  # This method is useful when you just need some logic from the Importer class
  # This methods returns an array with two elements:
  # * importer: the new importer (nil if download errors detected)
  def new_importer_with_unused_runner
    importer, = new_importer_with_runner(nil, nil, nil)
    importer
  end

  # Run importer, store results and return success state.
  def execute_importer(importer, runner, datasource_provider = nil, manual_fields = nil)
    if importer
      tracker = lambda do |state|
        self.state = state
        save
      end
      log.append('Before importer run')
      importer.run(tracker)
      log.append('After importer run')
    end

    store_results(importer, runner, datasource_provider, manual_fields)
    importer.nil? ? false : importer.success?
  rescue StandardError => e
    # Note: If this exception is not treated, results will not be defined
    # and the import will finish with a null error_code
    if manual_fields
      set_error(manual_fields.fetch(:error_code, 99999))
    end
    raise e
  end

  # Note: Assumes that if importer is nil an error happened
  # @param importer CartoDB::Connector::Importer|nil
  # @param runner CartoDB::Importer2::Runner|nil
  # @param datasource_provider mixed|nil
  # @param manual_fields Hash
  def store_results(importer=nil, runner=nil, datasource_provider=nil, manual_fields={})
    if importer.nil?
      set_error(manual_fields.fetch(:error_code, 99999), manual_fields.fetch(:log_info, nil))
    else
      self.results    = importer.results
      self.error_code = importer.error_code
      self.rejected_layers = importer.rejected_layers.join(',') if !importer.rejected_layers.empty?
      self.runner_warnings = runner.warnings.to_json if !runner.warnings.empty?

      # http_response_code is only relevant if a direct download is performed
      if runner && datasource_provider && datasource_provider.providers_download_url?
        self.http_response_code = runner.downloader.http_response_code
      end

      # Table.after_create() setted fields that won't be saved to "final" data import unless specified here
      self.table_name = importer.table.name if importer.success? && importer.table
      self.table_id   = importer.table.id if importer.success? && importer.table

      if importer.success?
        update_visualization_id(importer)
      end
      update_synchronization(importer)

      importer.success? ? set_datasource_audit_to_complete(datasource_provider,
                                                         importer.success? && importer.table ? importer.table.id : nil)
      : set_datasource_audit_to_failed(datasource_provider)
    end

    unless runner.nil?
      self.stats = ::JSON.dump(runner.stats)
    end
  end

  def update_visualization_id(importer)
    if importer.data_import.create_visualization
      self.visualization_id = importer.data_import.visualization_id
    end
  end

  def update_synchronization(importer)
    if synchronization_id
      log.type = Carto::Log::TYPE_SYNCHRONIZATION
      log.store
      log.append("synchronization_id: #{synchronization_id}")
      synchronization = CartoDB::Synchronization::Member.new(id: synchronization_id).fetch
      synchronization.name    = self.table_name
      synchronization.log_id  = log.id

      if importer.success?
        imported_table = ::Table.get_by_table_id(self.table_id)
        if !imported_table.nil? && imported_table.table_visualization
          synchronization.visualization_id = imported_table.table_visualization.id
        end

        synchronization.state = 'success'
        synchronization.error_code = nil
        synchronization.error_message = nil
        synchronization.modified_at = importer.last_modified
      else
        synchronization.state = 'failure'
        synchronization.error_code = error_code.blank? ? 9999 : error_code
        synchronization.error_message = get_error_text[:title] + ' ' + get_error_text[:what_about]
      end
      log.append("importer.success? #{synchronization.state}")
      synchronization.store
    end
  end

  def get_datasource_provider
    return nil if service_name == 'connector'
    datasource_name = (service_name.nil? || service_name.size == 0) ? Url::PublicUrl::DATASOURCE_NAME : service_name
    if service_item_id.nil? || service_item_id.size == 0
      self.service_item_id = data_source
    end

    get_datasource(datasource_name, service_item_id)
  end

  def get_downloader(datasource_provider)
    log.append("Fetching datasource #{datasource_provider} metadata for item id #{service_item_id}")

    metadata = datasource_provider.get_resource_metadata(service_item_id)

    if hit_platform_limit?(datasource_provider, metadata, current_user)
      raise CartoDB::Importer2::FileTooBigError.new(metadata.inspect)
    end

    if datasource_provider.providers_download_url?
      metadata_url = metadata[:url]
      resource_url = (metadata_url.present? && datasource_provider.providers_download_url?) ? metadata_url : data_source

      log.append("File will be downloaded from #{resource_url}")

      http_options = { http_timeout: ::DataImport.http_timeout_for(current_user) }
      CartoDB::Importer2::Downloader.new(current_user.id,
                                         resource_url,
                                         http_options,
                                         importer_config: Cartodb.config[:importer])
    else
      log.append('Downloading file data from datasource')

      http_timeout = ::DataImport.http_timeout_for(current_user)
      options = {
        http_timeout: http_timeout,
        importer_config: Cartodb.config[:importer],
        user_id: current_user.id
      }

      CartoDB::Importer2::DatasourceDownloader.new(datasource_provider, metadata, options, log)
    end
  end

  def hit_platform_limit?(datasource, metadata, user)
    if datasource.has_resource_size?(metadata)
      CartoDB::PlatformLimits::Importer::InputFileSize.new({ user: user })
                                                      .is_over_limit!(metadata[:size])
    else
      false
    end
  end

  def current_user
    @current_user ||= ::User[user_id]
  end

  def notify(results, import_id=nil)
    owner = ::User.where(:id => self.user_id).first
    imported_tables = results.select {|r| r.success }.length
    failed_tables = results.length - imported_tables

    # Calculate total size out of stats
    total_size = 0
    ::JSON.parse(stats).each { |stat| total_size += stat ? stat['size'] : 0 }
    importer_stats_aggregator.update_counter('total_size', total_size)

    import_time = self.updated_at - self.created_at
    cartodbfy_throughtput = (cartodbfy_time == 0.0 ? nil : (total_size / cartodbfy_time))

    import_log = {'user'                   => owner.username,
                  'state'                  => self.state,
                  'tables'                 => results.length,
                  'imported_tables'        => imported_tables,
                  'failed_tables'          => failed_tables,
                  'error_code'             => self.error_code,
                  'import_timestamp'       => Time.now,
                  'queue_server'           => `hostname`.strip,
                  'database_host'          => owner.database_host,
                  'service_name'           => self.service_name,
                  'data_type'              => self.data_type,
                  'is_sync_import'         => sync?,
                  'import_time'            => import_time,
                  'file_stats'             => ::JSON.parse(self.stats),
                  'resque_ppid'            => self.resque_ppid,
                  'user_timeout'           => ::DataImport.http_timeout_for(current_user),
                  'error_source'           => get_error_source,
                  'id'                     => self.id,
                  'total_size'             => total_size,
                  'cartodbfy_time'         => self.cartodbfy_time,
                  'import_throughput'      => (total_size / import_time),
                  'cartodbfy_throughtput'  => cartodbfy_throughtput,
                  'cartodbfy_import_ratio' => (self.cartodbfy_time / import_time)
                 }
    if !self.extra_options.nil?
      import_log['extra_options'] = self.extra_options
    end
    import_log.merge!(decorate_log(self))
    dataimport_logger.info(import_log.to_json)
    CartoDB::Importer2::MailNotifier.new(self, results, ::Resque).notify_if_needed

    user_id = user.id
    properties = {
      user_id: user_id,
      connection: {
        imported_from: service_name,
        data_from: data_type,
        sync: sync?,
        import_time: import_time,
        data_size: total_size,
        error_code: self.error_code
      }
    }

    if service_name == 'connector'
      connector_params = JSON.parse(service_item_id)
      properties[:connection][:provider] = connector_params['provider']
    end

    if results.any?
      results.each do |result|
        CartoDB::Metrics.new.report(:import, payload_for(result))

        properties[:connection][:file_type] = result.extension

        if result.success?
          Carto::Tracking::Events::CompletedConnection.new(user_id, properties).report
        else
          Carto::Tracking::Events::FailedConnection.new(user_id, properties).report
        end
      end
    elsif state == STATE_FAILURE
      Carto::Tracking::Events::FailedConnection.new(user_id, properties).report
    end

    track_results(results, import_id, properties) unless import_id.nil?
  end

  def importer_stats_aggregator
    @importer_stats_aggregator ||= CartoDB::Stats::Importer.instance
  end

  def decorate_log(data_import)
    decoration = { retrieved_items: 0 }
    if data_import.success && data_import.table_id && data_import.from_query.nil? &&
       data_import.table_copy.nil?
      datasource = get_datasource_provider
      if datasource && datasource.persists_state_via_data_import?
        decoration = datasource.get_audit_stats
      end
    end
    decoration
  end

  def payload_for(result=nil)
    log.store
    payload = {
      file_url:       public_url,
      distinct_id:    current_user.username,
      username:       current_user.username,
      account_type:   current_user.account_type,
      database:       current_user.database_name,
      email:          current_user.email,
      log:            log.to_s
    }
    payload.merge!(
      name:           result.name,
      extension:      result.extension,
      success:        result.success,
      error_code:     result.error_code,
    ) if result
    payload.merge!(
      file_url_hostname: URI.parse(public_url).hostname
    ) if public_url rescue nil
    payload.merge!(error_title: get_error_text[:title]) if state == STATE_FAILURE
    payload
  end

  # @param datasource_name String
  # @param service_item_id String|nil
  # @return mixed|nil
  # @throws DataSourceError
  def get_datasource(datasource_name, service_item_id)
    begin
      oauth = current_user.oauths.select(datasource_name)
      # Tables metadata DB also store resque data
      datasource = DatasourcesFactory.get_datasource(
        datasource_name, current_user, {
                                          http_timeout: ::DataImport.http_timeout_for(current_user),
                                          redis_storage: $tables_metadata,
                                          user_defined_limits: ::JSON.parse(user_defined_limits).symbolize_keys
                                       })
      datasource.token = oauth.token unless oauth.nil?
    rescue StandardError => ex
      log.append("Exception: #{ex.message}")
      log.append(ex.backtrace, false)
      CartoDB.report_exception(ex, 'Import error: ', error_info: ex.message + ex.backtrace.join)
      raise CartoDB::DataSourceError.new("Datasource #{datasource_name} could not be instantiated")
    end
    if service_item_id.nil?
      raise CartoDB::DataSourceError.new("Datasource #{datasource_name} without item id")
    end

    if datasource.persists_state_via_data_import?
      datasource.data_import_item = self
    end

    datasource
  end

  def set_error(error_code, log_info='')
    log.append("Additional error info: #{log_info}") unless log_info.empty?
    self.results = [CartoDB::Importer2::Result.new(
                      success: false, error_code: error_code
                    )]
    self.error_code = error_code
    self.state = STATE_FAILURE
  end

  def set_merge_error(error_code, log_info='')
    log.append("Going to set merge error with code #{error_code}")
    set_error(error_code, log_info)
  end

  def set_datasource_audit_to_complete(datasource, table_id = nil)
    if datasource && datasource.persists_state_via_data_import?
      datasource.data_import_item = self
      datasource.set_audit_to_completed(table_id)
    end
  end

  def set_datasource_audit_to_failed(datasource)
    if datasource && datasource.persists_state_via_data_import?
      datasource.data_import_item = self
      datasource.set_audit_to_failed
    end
  end

  def track_results(results, import_id, import_properties)
    current_user_id = current_user.id
    return unless current_user_id

    if visualization_id
      Carto::Tracking::Events::CreatedMap.new(current_user_id, import_properties.merge(
                                              user_id: current_user_id,
                                              visualization_id: visualization_id,
                                              origin: 'import')).report
    end

    results.select(&:success?).each do |result|
      condition, origin = if result.name
                            [{ data_import_id: import_id, name: result.name },
                             from_common_data? ? 'common-data' : 'import']
                          else
                            [{ data_import_id: import_id }, 'copy']
                          end

      user_table = ::UserTable.where(condition).first
      map = user_table.map if user_table
      if map
        vis = Carto::Visualization.where(map_id: map.id).first

        Carto::Tracking::Events::CreatedDataset.new(current_user_id, import_properties.merge(
                                                    user_id: current_user_id,
                                                    visualization_id: vis.id,
                                                    origin: origin)).report
      end
    end
  rescue StandardError => e
    log_warning(message: "Carto::Tracking: Couldn't report event", exception: e)
  end

  def sync?
    synchronization_id.present?
  end
end
