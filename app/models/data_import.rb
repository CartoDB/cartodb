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
require_relative '../connectors/importer'

class DataImport < Sequel::Model
  REDIS_LOG_KEY_PREFIX          = 'importer'
  REDIS_LOG_EXPIRATION_IN_SECS  = 3600 * 24 * 2 # 2 days
  MERGE_WITH_UNMATCHING_COLUMN_TYPES_RE = /No .*matches.*argument type.*/

  attr_accessor   :log, :results

  PUBLIC_ATTRIBUTES = %W{ id user_id table_id data_type table_name state
    error_code queue_id get_error_text tables_created_count 
    synchronization_id }

  def after_initialize
    instantiate_log
    self.results  = []
    self.state    ||= 'uploading'
  end #after_initialize

  def before_save
    self.logger = self.log.id unless self.logger.present?
    self.updated_at = Time.now
  end

  def public_values
    values = Hash[PUBLIC_ATTRIBUTES.map{ |attribute| [attribute, send(attribute)] }]
    values.merge!('queue_id' => id)
    values.merge!(success: success) if (state == 'complete' || state == 'failure')
    values
  end

  def run_import!
    log.append 'Before dispatch'
    success = !!dispatch
    log.append 'After dispatch'
    if self.results.empty?
      self.error_code = 1002
      self.state      = 'failure'
      save
      return self
    end

    success ? handle_success : handle_failure
    Rails.logger.debug log.to_s
    self
  rescue => exception
    log.append "Exception: #{exception.to_s}"
    log.append exception.backtrace
    stacktrace = exception.to_s + exception.backtrace.join
    Rollbar.report_message('Import error', 'error', error_info: stacktrace)
    handle_failure
    self
  end

  def get_error_text
    return CartoDB::IMPORTER_ERROR_CODES[99999] if self.error_code.blank? 
    return CartoDB::IMPORTER_ERROR_CODES[self.error_code]
  end

  def raise_over_table_quota_error
    log.append 'Over account table limit, please upgrade'
    self.error_code = 8002
    self.state      = 'failure'
    save
    raise CartoDB::QuotaExceeded, 'More tables required'
  end

  def mark_as_failed_if_stuck!    
    return false unless stuck?

    log.append 'Import timed out'

    self.success  = false
    self.state    = 'failure'
    save

    CartoDB::notify_exception(
      CartoDB::Importer2::GenericImportError.new('Import timed out'),
      user: current_user
    )
    return true
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

  def remove_uploaded_resources
    return nil unless uploaded_file

    path = Rails.root.join('public', 'uploads', uploaded_file[1])
    FileUtils.rm_rf(path) if Dir.exists?(path)
  end #remove_uploaded_resources

  def handle_success
    CartodbStats.increment_imports
    self.success  = true
    self.state    = 'complete'
    log.append "SUCCESS!\n"
    save
    notify(results)
    self
  end #handle_success

  def handle_failure
    self.success    = false
    self.state      = 'failure'
    log.append "ERROR!\n"
    self.save
    notify(results)
    self
  rescue => exception
    log.append "Exception: #{exception.to_s}"
    log.append exception.backtrace
    self
  end #handle_failure

  def table
    Table.where(id: table_id, user_id: user_id).first
  end #table

  private

  def dispatch
    return migrate_existing   if migrate_table.present?
    return from_table         if table_copy.present? || from_query.present?
    new_importer       
  rescue => exception
    puts exception.to_s + exception.backtrace.join("\n")
    raise
  end #dispatch

  def running_import_ids
    Resque::Worker.all.map do |worker|
      next unless worker.job['queue'] == 'imports'
      worker.job['payload']['args'].first['job_id'] rescue nil
    end.compact
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

  def from_table
    log.append 'from_table()'

    number_of_tables = 1
    quota_checker = CartoDB::QuotaChecker.new(current_user)
    if quota_checker.will_be_over_table_quota?(number_of_tables)
      raise_over_table_quota_error 
    end

    query = table_copy ? "SELECT * FROM #{table_copy}" : from_query
    new_table_name = import_from_query(table_name, query)

    self.update(table_names: new_table_name)
    migrate_existing(new_table_name)

    self.results.push CartoDB::Importer2::Result.new(success: true, error: nil)
  rescue Sequel::DatabaseError => exception
    if exception.to_s =~ MERGE_WITH_UNMATCHING_COLUMN_TYPES_RE
      set_merge_error(8004)
    else
      set_merge_error(8003)
    end
    false
  end

  def import_from_query(name, query)
    log.append 'import_from_query()'

    self.data_type    = 'query'
    self.data_source  = query
    self.save

    candidates =  current_user.tables.select_map(:name)
    table_name = Table.get_valid_table_name(name, name_candidates: candidates)
    current_user.in_database.run(%Q{CREATE TABLE #{table_name} AS #{query}})
    if current_user.over_disk_quota?
      log.append 'Over storage quota'
      log.append "Dropping table #{table_name}"
      current_user.in_database.run(%Q{DROP TABLE #{table_name}})
      self.error_code = 8001
      self.state      = 'failure'
      save
      raise CartoDB::QuotaExceeded, 'More storage required'
    end

    table_name
  end

  def migrate_existing(imported_name=migrate_table, name=nil)
    new_name = imported_name || name

    log.append 'migrate_existing()'

    table         = Table.new
    table.user_id = user_id
    table.name    = new_name
    table.migrate_existing_table = imported_name

    if table.valid?
      log.append 'Table valid'
      table.save
      table.optimize
      table.map.recalculate_bounds!
      if current_user.remaining_quota < 0
        log.append 'Over storage quota, removing table'
        self.error_code = 8001
        table.destroy
        return false
      end
      refresh
      self.table_id = table.id
      self.table_name = table.name
      save
      true
    else
      reload
      log.append "Table invalid: Error linking #{imported_name} to UI: " + table.errors.full_messages.join(' - ')
      false
    end
  end

  def pg_options
    Rails.configuration.database_configuration[Rails.env].symbolize_keys
      .merge(
        user:     current_user.database_username,
        password: current_user.database_password,
        database: current_user.database_name,
        host:     current_user.database_host
      ) {|key, o, n| n.nil? || n.empty? ? o : n}
  end #pg_options

  def new_importer
    log.append 'new_importer()'

    tracker       = lambda { |state| self.state = state; save }
    downloader    = CartoDB::Importer2::Downloader.new(data_source)
    runner        = CartoDB::Importer2::Runner.new(
                      pg_options, downloader, log, current_user.remaining_quota
                    )
    registrar     = CartoDB::TableRegistrar.new(current_user, Table)
    quota_checker = CartoDB::QuotaChecker.new(current_user)
    database      = current_user.in_database
    importer      = CartoDB::Connector::Importer.new(
                      runner, registrar, quota_checker, database, id
                    )

    log.append 'Before run.'
    importer.run(tracker)
    log.append 'After run.'

    self.results    = importer.results
    self.error_code = importer.error_code
    self.table_name = importer.table.name if importer.success? && importer.table
    self.table_id   = importer.table.id if importer.success? && importer.table
    if synchronization_id
      log.append "synchronization_id: #{synchronization_id}"
      synchronization = CartoDB::Synchronization::Member.new(id: synchronization_id).fetch
      synchronization.name    = self.table_name
      synchronization.log_id  = log.id

      if importer.success?
        synchronization.state = 'success'
        synchronization.error_code = nil
        synchronization.error_message = nil
      else
        synchronization.state = 'failure'
        synchronization.error_code = error_code
        synchronization.error_message = get_error_text
      end
      log.append "importer.success? #{synchronization.state}"
      synchronization.store
    end
    importer.success?
  end

  def current_user
    @current_user ||= User[user_id]
  end

  def notify(results)
    results.each { |result| CartoDB::Metrics.new.report(payload_for(result)) }
  end

  def payload_for(result=nil)
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
    payload.merge!(error_title: get_error_text) if state == 'failure'
    payload
  end

  def set_merge_error(error_code)
    log.append("going to set merge error with code #{error_code}")
    self.results = [CartoDB::Importer2::Result.new(
      success: false, error_code: error_code
    )]
    self.error_code = error_code
    self.state = 'failure'
  end 
end

