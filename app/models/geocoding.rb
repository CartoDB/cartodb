# encoding: UTF-8
require 'socket'
require_relative '../../services/table-geocoder/lib/table_geocoder_factory'
require_relative '../../services/table-geocoder/lib/exceptions'
require_relative '../../services/table-geocoder/lib/mail_geocoder'
require_relative '../../services/geocoder/lib/geocoder_config'
require_relative '../../lib/cartodb/metrics'
require_relative 'log'
require_relative '../../lib/cartodb/stats/geocoding'

require_dependency 'carto/configuration'

class Geocoding < Sequel::Model
  include Carto::Configuration

  ALLOWED_KINDS   = %w(admin0 admin1 namedplace postalcode high-resolution ipaddress)


  PUBLIC_ATTRIBUTES = [:id, :table_id, :table_name, :state, :kind, :country_code, :region_code, :formatter,
                       :geocoder_type, :geometry_type, :error, :processed_rows, :cache_hits, :processable_rows,
                       :real_rows, :price, :used_credits, :remaining_quota, :country_column, :region_column,
                       :data_import_id, :error_code]

  # Characters in the following Unicode categories: Letter, Mark, Number and Connector_Punctuation,
  # plus spaces and single quotes
  SANITIZED_FORMATTER_REGEXP = /\A[[[:word:]]\s\,\']*\z/

  MIN_GEOCODING_TIME_TO_NOTIFY = 3 * 60 #seconds

  many_to_one :user
  many_to_one :user_table, :key => :table_id
  many_to_one :automatic_geocoding
  many_to_one :data_import

  attr_reader :table_geocoder
  attr_reader :started_at, :finished_at
  attr_reader :log

  def self.get_not_aggregated_user_geocoding_calls(db, user_id, date_from, date_to)
    geocoding_calls_sql = "SELECT date(created_at), sum(processed_rows) as processed_rows, " \
                          "sum(cache_hits) as cache_hits FROM geocodings WHERE kind = 'high-resolution' " \
                          "AND user_id = ? AND geocodings.created_at >= ? and geocodings.created_at <= ?" \
                          "GROUP BY date(created_at) ORDER BY date(created_at) DESC"
    db.fetch(geocoding_calls_sql, user_id, date_from, date_to + 1.days).all
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
  end

  def validate
    super
    validates_presence :formatter
    # INFO: since we want to register geocodings during importing we can't register the table
    # validates_presence :table_id
    validates_includes ALLOWED_KINDS, :kind
  end

  def before_save
    super
    self.updated_at = Time.now
    # cancel if state == 'cancelled'
  end

  def geocoding_logger
    @@geocoding_logger ||= Logger.new(log_file_path('geocodings.log'))
  end

  def error
    additional_info = Carto::GeocoderErrors.additional_info(error_code)
    if additional_info
      { title: additional_info.title, description: additional_info.what_about }
    else
      { title: 'Geocoding error', description: '' }
    end
  end

  # The table geocoder is meant to be instantiated just once.
  # Memoize the table geocoder or nil if it couldn't be instantiated
  def table_geocoder
    if !defined?(@table_geocoder)
      begin
        @table_geocoder = Carto::TableGeocoderFactory.get(user,
                                                          self,
                                                          CartoDB::GeocoderConfig.instance.get,
                                                          table_service,
                                                          original_formatter: formatter,
                                                          formatter: sanitize_formatter,
                                                          remote_id: remote_id,
                                                          countries: country_code,
                                                          regions: region_code,
                                                          geometry_type: geometry_type,
                                                          kind: kind,
                                                          max_rows: max_geocodable_rows,
                                                          country_column: country_column,
                                                          region_column: region_column,
                                                          log: log)
      rescue => e
        @table_geocoder = nil
        raise e
      end
    else
      @table_geocoder
    end
  end

  # INFO: table_geocoder method is very coupled to table model, and we want to use this model during imports, without table yet.
  # this method allows to inject the dependency to the geocoder
  # TODO: refactor geocoder instantiation out of this class
  def force_geocoder geocoder
    @table_geocoder = geocoder
  end

  def cancel
    log.append_and_store "Cancelling job because of user request"
    table_geocoder.cancel
  rescue => e
    log.append_and_store "Error trying to cancel a job because of user request: #{e.inspect}"
    count ||= 1
    retry unless (count = count.next) > 5
    CartoDB::notify_exception(e, user: user)
  end

  # INFO: this method shall always be called from a queue processor
  def run!
    @started_at = Time.now
    log.append_and_store "Running geocoding job on server #{Socket.gethostname} with PID: #{Process.pid}"
    if self.force_all_rows == true
      table_geocoder.reset_cartodb_georef_status
    else
      table_geocoder.mark_rows_to_geocode
    end

    store_geocoder_info(Process.pid)
    processable_rows = self.class.processable_rows(table_service)
    if processable_rows == 0
      self.update(state: 'finished', real_rows: 0, used_credits: 0, processed_rows: 0, cache_hits: 0)
      self.report
      return
    end

    rows_geocoded_before = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name).where(cartodb_georef_status: true).count rescue 0

    self.run_geocoding!(processable_rows, rows_geocoded_before)
  rescue => e
    # state == nil probably means it has failed even before run_geocoding begun
    handle_geocoding_failure(e, rows_geocoded_before || 0) if state == nil
    log.append_and_store "Unexpected exception: #{e}"
    log.append_and_store e.backtrace
    CartoDB.notify_exception(e)
    raise e
  ensure
    log.store # Make sure the log is stored in DB
    user.db_service.reset_pooled_connections
  end

  def run_geocoding!(processable_rows, rows_geocoded_before = 0)
    log.append_and_store "run_geocoding!()"
    self.update state: 'started', processable_rows: processable_rows
    @started_at ||= Time.now

    # INFO: this is where the real stuff is done
    table_geocoder.run
    # Sync state to avoid overwrites for state and log
    refresh
    return false if cancelled?

    self.update(table_geocoder.update_geocoding_status)

    # TODO better exception handling here
    raise 'Geocoding failed'  if state == 'failed'
    raise 'Geocoding timed out'  if state == 'timeout'

    handle_geocoding_success(rows_geocoded_before)
  rescue => e
    handle_geocoding_failure(e, rows_geocoded_before)
  end

  def report(error = nil)
    payload = metrics_payload(error)
    CartoDB::Metrics.new.report(:geocoding, payload)
    payload.delete_if {|k,v| %w{distinct_id email table_id}.include?(k.to_s)}
    geocoding_logger.info(payload.to_json)
  end

  def self.processable_rows(table_service, force_all_rows=false)
    dataset = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name)
    if !force_all_rows && dataset.columns.include?(:cartodb_georef_status)
      dataset = dataset.exclude(cartodb_georef_status: true)
    end
    dataset.count
  end # self.processable_rows

  def calculate_used_credits
    return 0 unless kind == 'high-resolution' && geocoder_type == 'heremaps'
    total_rows       = processed_rows.to_i + cache_hits.to_i
    geocoding_quota  = user.organization.present? ? user.organization.geocoding_quota.to_i : user.geocoding_quota
    used_geocoding_calls = user.organization_user? ? user.organization.get_geocoding_calls : user.get_geocoding_calls
    # ::User#get_geocoding_calls includes this geocoding run, so we discount it
    remaining_quota  = geocoding_quota + total_rows - used_geocoding_calls
    remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
    used_credits     = total_rows - remaining_quota
    (used_credits > 0 ? used_credits : 0)
  end # calculate_used_credits

  def price
    return 0 unless used_credits.to_i > 0
    (user.geocoding_block_price * used_credits) / ::User::GEOCODING_BLOCK_SIZE.to_f
  end # price

  def cost
    return 0 unless kind == 'high-resolution'
    processed_rows.to_i * CartoDB::GeocoderConfig.instance.get['cost_per_hit_in_cents'] rescue 0
  end

  def remaining_quota
    user.remaining_geocoding_quota
  end # remaining_quota

  def sanitize_formatter
    translated_formatter = translate_formatter
    if translated_formatter =~ SANITIZED_FORMATTER_REGEXP
      translated_formatter
    else
      CartoDB::Logger.warning(message: %{Incorrect formatter string received: "#{formatter}"}, user: user)
      ''
    end
  end

  # {field}, SPAIN => field, ', SPAIN'
  def translate_formatter
    translated = formatter.to_s.squish
    translated.prepend("'") unless /^\{/.match(formatter)
    translated << "'" unless /\}$/.match(formatter)
    translated.gsub(/^\{/, '')
              .gsub(/\}$/, '')
              .gsub(/\}/, ", '")
              .gsub(/\{/, "', ")
  end # translate_formatter

  def max_geocodable_rows
    # This is an arbitrary number, previously set to 1M
    return 50000 if user.soft_geocoding_limit?
    user.remaining_geocoding_quota
  end

  def successful_rows
    real_rows.to_i
  end

  def failed_rows
    processable_rows.to_i - real_rows.to_i
  end

  def metrics_payload(exception = nil)
    payload = {
      created_at:       created_at,
      distinct_id:      user.username,
      username:         user.username,
      email:            user.email,
      id:               id,
      table_id:         table_id,
      kind:             kind,
      country_code:     country_code,
      formatter:        formatter,
      geocoder_type:    geocoder_type,
      geometry_type:    geometry_type,
      processed_rows:   processed_rows,
      cache_hits:       cache_hits,
      processable_rows: processable_rows,
      real_rows:        real_rows,
      successful_rows:  successful_rows,
      failed_rows:      failed_rows,
      price:            price,
      cost:             cost,
      used_credits:     used_credits,
      remaining_quota:  remaining_quota,
      data_import_id:   data_import_id,
      batched: self.batched
    }
    if state == 'finished' && exception.nil?
      payload.merge!(
        success: true
      )
    elsif exception.present?
      payload.merge!(
        success: false,
        error: exception.message,
        backtrace: exception.backtrace
      )
    else
      payload.merge!(
        success: false,
        error: error
      )
    end

    payload.merge!(queue_time: started_at - created_at) if started_at && created_at
    payload.merge!(processing_time: finished_at - started_at) if started_at && finished_at

    payload
  end

  def log
    @log ||= instantiate_log
  end

  def cancelled?
    state == 'cancelled'
  end

  def timeout?
    state == 'timeout'
  end

  private

  def table_service
    @table_service ||= Table.new(user_table: user_table) if user_table.present?
  end

  def instantiate_log
    if self.log_id
      @log = CartoDB::Log.where(id: log_id).first
    else
      @log = CartoDB::Log.new({
          type: CartoDB::Log::TYPE_GEOCODING,
          user_id: user.id
        })
      @log.store
      self.log_id = @log.id
      self.save
    end
    @log
  end

  def handle_geocoding_success(rows_geocoded_before)
    self.update(cache_hits: table_geocoder.cache.hits) if table_geocoder.respond_to?(:cache)
    stats_aggregator = CartoDB::Stats::Geocoding.instance
    stats_aggregator.gauge("requests", "+#{self.processed_rows}") rescue nil
    stats_aggregator.gauge("cache_hits", "+#{self.cache_hits}") rescue nil

    @finished_at = Time.now
    self.batched = table_geocoder.used_batch_request?
    self.geocoder_type = table_geocoder.name
    geocoded_rows = total_geocoded_rows(rows_geocoded_before)
    self.update(state: 'finished', real_rows: geocoded_rows, used_credits: calculate_used_credits)
    send_report_mail(state, self.table_name, nil, self.processable_rows, geocoded_rows)
    log.append_and_store "Geocoding finished"
    # In the import table_service could be nil
    if !table_service.nil?
      # To store the bbox in visualizations
      table_service.update_bounding_box
    end
    self.report
  end

  def handle_geocoding_failure(raised_exception, rows_geocoded_before)
    @finished_at = Time.now
    self.batched = table_geocoder.nil? ? false : table_geocoder.used_batch_request?
    self.geocoder_type = table_geocoder.nil? ? '' : table_geocoder.name
    if raised_exception.is_a? Carto::GeocoderErrors::GeocoderBaseError
      self.error_code = raised_exception.class.additional_info.error_code
    end
    self.update(state: 'failed', processed_rows: 0, cache_hits: 0)
    CartoDB::notify_exception(raised_exception, user: user)
    geocoded_rows = total_geocoded_rows(rows_geocoded_before)
    send_report_mail(state, self.table_name, error_code, self.processable_rows, geocoded_rows)
    log.append_and_store "Unexpected exception: #{raised_exception}"
    log.append_and_store raised_exception.backtrace
    self.report(raised_exception)
  end

  def total_geocoded_rows(rows_geocoded_before)
    rows_geocoded_after = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name).where('cartodb_georef_status is true and the_geom is not null').count rescue 0
    rows_geocoded_after - rows_geocoded_before
  end

  # Used in the run! method
  def send_report_mail(state, table_name, error_code=nil, processable_rows, number_geocoded_rows)
    geocoding_time = @finished_at - @started_at
    CartoDB::Geocoder::MailNotifier.new(user.id, state, table_name, error_code, processable_rows, number_geocoded_rows, geocoding_time).notify_if_needed
  end

  def store_geocoder_info(pid)
    # we use the object instead of the method because
    # we don't want to build the object until it has
    # all the needed data that is created in the run method
    # of the geocoder object. If not is going to fail because
    # the object is memoized.
    self.pid = pid
    if defined?(@table_geocoder)
      self.geocoder_type = table_geocoder.name
    end
    self.save
  end
end
