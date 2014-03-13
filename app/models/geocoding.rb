# encoding: UTF-8'
require_relative '../../services/table-geocoder/lib/table_geocoder'
require_relative '../../services/table-geocoder/lib/internal_geocoder.rb'

class Geocoding < Sequel::Model

  DEFAULT_TIMEOUT = 15.minutes
  ALLOWED_KINDS   = %w(admin0 admin1 namedplace postalcode high-resolution)

  PUBLIC_ATTRIBUTES = [:id, :table_id, :state, :kind, :country_code, :formatter, :geometry_type, 
                       :error, :processed_rows, :cache_hits]

  many_to_one :user
  many_to_one :table
  many_to_one :automatic_geocoding

  attr_reader :table_geocoder

  attr_accessor :run_timeout

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
  end

  def validate
    super
    validates_presence :formatter
    validates_presence :table_id
    validates_includes ALLOWED_KINDS, :kind
  end # validate

  def after_initialize
    super
    @run_timeout = DEFAULT_TIMEOUT
  end #after_initialize

  def before_save
    super
    self.updated_at = Time.now
    cancel if state == 'cancelled'
  end # before_save

  def error
    { title: 'Geocoding error', description: '' }
  end

  def table_geocoder
    geocoder_class = (kind == 'high-resolution' ? CartoDB::TableGeocoder : CartoDB::InternalGeocoder)
    config = Cartodb.config[:geocoder].deep_symbolize_keys.merge(
      table_name:    table.try(:name),
      formatter:     translate_formatter,
      connection:    (user.present? ? user.in_database(as: :superuser) : nil),
      remote_id:     remote_id,
      countries:     country_code,
      geometry_type: geometry_type,
      kind:          kind,
      max_rows:      max_geocodable_rows
    )
    @table_geocoder ||= geocoder_class.new(config)
  end # table_geocoder

  def cancel
    table_geocoder.cancel
  rescue => e
    count ||= 1
    retry unless (count = count.next) > 5
    CartoDB::notify_exception(e, user: user)
  end # cancel

  def run!
    self.update(state: 'started')
    table_geocoder.run
    self.update remote_id: table_geocoder.remote_id
    started = Time.now
    begin
      self.update(table_geocoder.update_geocoding_status)
      puts "Processed: #{processed_rows}"
      raise "Geocoding timeout" if Time.now - started > run_timeout and ['started', 'submitted', 'accepted'].include? state
      sleep(2)
    end until ['completed', 'cancelled', 'failed'].include? state
    return false if state == 'cancelled'
    self.update(cache_hits: table_geocoder.cache.hits) if table_geocoder.respond_to?(:cache)
    Statsd.gauge("geocodings.requests", "+#{self.processed_rows}") rescue nil
    Statsd.gauge("geocodings.cache_hits", "+#{self.cache_hits}") rescue nil
    table_geocoder.process_results
    create_automatic_geocoding if automatic_geocoding_id.blank?
    self.update(state: 'finished')
  rescue => e
    self.update(state: 'failed', processed_rows: 0, cache_hits: 0)
    CartoDB::notify_exception(e, user: user)
  end # run!

  def create_automatic_geocoding
    # Disabled until we stop sending previously failed rows
    # best way to do this: use append mode on synchronizations
    # geocoder = AutomaticGeocoding.create(table: table)
    # self.update(automatic_geocoding_id: geocoder.id)
  end # create_automatic_geocoder

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
    return nil if user.blank? || !user.hard_geocoding_limit?
    user.geocoding_quota - user.get_geocoding_calls
  rescue
    nil
  end # max_geocodable_rows
end
