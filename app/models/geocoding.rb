# encoding: UTF-8'
require_relative '../../services/table-geocoder/lib/table_geocoder'
require_relative '../../services/table-geocoder/lib/internal_geocoder.rb'
require_relative '../../lib/cartodb/metrics'

class Geocoding < Sequel::Model

  DB_TIMEOUT_MS              = 100.minutes.to_i * 1000
  ALLOWED_KINDS   = %w(admin0 admin1 namedplace postalcode high-resolution ipaddress)

  PUBLIC_ATTRIBUTES = [:id, :table_id, :state, :kind, :country_code, :region_code, :formatter, :geometry_type,
                       :error, :processed_rows, :cache_hits, :processable_rows, :real_rows, :price,
                       :used_credits, :remaining_quota, :country_column, :region_column, :data_import_id]

  # Characters in the following Unicode categories: Letter, Mark, Number and Connector_Punctuation,
  # plus spaces and single quotes
  SANITIZED_FORMATTER_REGEXP = /\A[[[:word:]]\s\,\']*\z/

  many_to_one :user
  many_to_one :user_table, :key => :table_id
  many_to_one :automatic_geocoding
  many_to_one :data_import

  attr_reader :table_geocoder
  attr_reader :started_at, :finished_at

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
  end

  def validate
    super
    validates_presence :formatter
    # INFO: since we want to register geocodings during importing we can't register the table
    # validates_presence :table_id
    validates_includes ALLOWED_KINDS, :kind
  end # validate

  def before_save
    super
    self.updated_at = Time.now
    cancel if state == 'cancelled'
  end # before_save

  def geocoding_logger
    @@geocoding_logger ||= Logger.new("#{Rails.root}/log/geocodings.log")
  end

  def error
    { title: 'Geocoding error', description: '' }
  end

  def table_geocoder
    geocoder_class = (kind == 'high-resolution' ? CartoDB::TableGeocoder : CartoDB::InternalGeocoder::Geocoder)
    # Reset old connections to make sure changes apply. 
    # NOTE: This assumes it's being called from a Resque job
    if user.present?
      user.reset_pooled_connections
      user_connection = user.in_database(statement_timeout: DB_TIMEOUT_MS)
    else
      user_connection = nil
    end

    config = Cartodb.config[:geocoder].deep_symbolize_keys.merge(
      table_schema:  table_service.try(:database_schema),
      table_name:    table_service.try(:name),
      qualified_table_name: table_service.try(:qualified_table_name),
      sequel_qualified_table_name: table_service.try(:sequel_qualified_table_name),
      formatter:     sanitize_formatter,
      connection:    user_connection,
      remote_id:     remote_id,
      countries:     country_code,
      regions:       region_code,
      geometry_type: geometry_type,
      kind:          kind,
      max_rows:      max_geocodable_rows,
      country_column: country_column,
      region_column: region_column
    )
    @table_geocoder ||= geocoder_class.new(config)
  end # table_geocoder

  # INFO: table_geocoder method is very coupled to table model, and we want to use this model during imports, without table yet.
  # this method allows to inject the dependency to the geocoder
  # TODO: refactor geocoder instantiation out of this class
  def force_geocoder geocoder
    @table_geocoder = geocoder
  end

  def cancel
    table_geocoder.cancel
  rescue => e
    count ||= 1
    retry unless (count = count.next) > 5
    CartoDB::notify_exception(e, user: user)
  end # cancel

  # INFO: this method shall always be called from a queue processor
  def run!
    processable_rows = self.class.processable_rows(table_service)
    if processable_rows == 0
      self.update(state: 'finished', real_rows: 0, used_credits: 0, processed_rows: 0, cache_hits: 0)
      self.report
      return
    end

    rows_geocoded_before = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name).where(cartodb_georef_status: true).count rescue 0

    self.run_geocoding!(processable_rows, rows_geocoded_before)
  ensure
    user.reset_pooled_connections if user.present?
  end

  def run_geocoding!(processable_rows, rows_geocoded_before = 0)
    self.update state: 'started', processable_rows: processable_rows, batched: table_geocoder.use_batch_process?
    @started_at = Time.now

    # INFO: this is where the real stuff is done
    table_geocoder.run

    self.update remote_id: table_geocoder.remote_id
    self.update(table_geocoder.update_geocoding_status)
    raise 'Geocoding failed'  if state == 'failed'
    return false if state == 'cancelled'

    self.update(cache_hits: table_geocoder.cache.hits) if table_geocoder.respond_to?(:cache)
    Statsd.gauge("geocodings.requests", "+#{self.processed_rows}") rescue nil
    Statsd.gauge("geocodings.cache_hits", "+#{self.cache_hits}") rescue nil
    table_geocoder.process_results if state == 'completed'
    create_automatic_geocoding if automatic_geocoding_id.blank?
    rows_geocoded_after = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name).where('cartodb_georef_status is true and the_geom is not null').count rescue 0

    @finished_at = Time.now
    self.update(state: 'finished', real_rows: rows_geocoded_after - rows_geocoded_before, used_credits: calculate_used_credits)
    self.report
  rescue => e
    @finished_at = Time.now
    self.update(state: 'failed', processed_rows: 0, cache_hits: 0)
    CartoDB::notify_exception(e, user: user)
    self.report(e)
  end # run!

  def report(error = nil)
    payload = metrics_payload(error)
    CartoDB::Metrics.new.report(:geocoding, payload)
    payload.delete_if {|k,v| %w{distinct_id email table_id}.include?(k.to_s)}
    geocoding_logger.info(payload.to_json)
  end

  def self.processable_rows(table_service)
    dataset = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name)
    dataset = dataset.where(cartodb_georef_status: nil) if dataset.columns.include?(:cartodb_georef_status)
    dataset.count
  end # self.processable_rows

  def calculate_used_credits
    return 0 unless kind == 'high-resolution'
    total_rows       = processed_rows.to_i + cache_hits.to_i
    geocoding_quota  = user.organization.present? ? user.organization.geocoding_quota.to_i : user.geocoding_quota
    # User#get_geocoding_calls includes this geocoding run, so we discount it
    remaining_quota  = geocoding_quota + total_rows - user.get_geocoding_calls
    remaining_quota  = (remaining_quota > 0 ? remaining_quota : 0)
    used_credits     = total_rows - remaining_quota
    (used_credits > 0 ? used_credits : 0)
  end # calculate_used_credits

  def price
    return 0 unless used_credits.to_i > 0
    (user.geocoding_block_price * used_credits) / User::GEOCODING_BLOCK_SIZE.to_f
  end # price

  def cost
    return 0 unless kind == 'high-resolution'
    processed_rows.to_i * Cartodb.config[:geocoder]['cost_per_hit_in_cents'] rescue 0
  end

  def remaining_quota
    user.remaining_geocoding_quota
  end # remaining_quota

  def create_automatic_geocoding
    # Disabled until we stop sending previously failed rows
    # best way to do this: use append mode on synchronizations
    # geocoder = AutomaticGeocoding.create(table: table)
    # self.update(automatic_geocoding_id: geocoder.id)
  end # create_automatic_geocoder

  def sanitize_formatter
    translated_formatter = translate_formatter
    if translated_formatter =~ SANITIZED_FORMATTER_REGEXP
      translated_formatter
    else
      # TODO better remove this trace once everything is fine
      Rollbar.report_message(%Q{Incorrect formatter string received: "#{formatter}"},
                             'warning',
                             {user_id: user.id})
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
    return nil if user.blank? || user.soft_geocoding_limit?
    user.remaining_geocoding_quota
  rescue
    nil
  end # max_geocodable_rows

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


  private

  def table_service
    @table_service ||= Table.new(user_table: user_table) if user_table.present?
  end

end
