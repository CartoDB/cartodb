# encoding: UTF-8'
require_relative '../../services/table-geocoder/lib/table_geocoder'

class Geocoding < Sequel::Model

  many_to_one :user
  many_to_one :table
  many_to_one :automatic_geocoding

  attr_reader :table_geocoder

  def validate
    super
    validates_presence :formatter
    validates_presence :table_id
  end # validate

  def after_initialize
    super
    instantiate_table_geocoder
  end #after_initialize

  def after_create
    super
    instantiate_table_geocoder
  end # after_create

  def before_save
    super
    self.updated_at = Time.now
    cancel if state == 'cancelled'
  end # before_save

  def instantiate_table_geocoder
    @table_geocoder = CartoDB::TableGeocoder.new(Cartodb.config[:geocoder].symbolize_keys.merge(
      table_name: table.try(:name),
      formatter:  translate_formatter,
      connection: (user.present? ? user.in_database(as: :superuser) : nil),
      remote_id:  remote_id,
      max_rows:   max_geocodable_rows
    ))
  end # instantiate_table_geocoder

  def cancel
    table_geocoder.cancel
  rescue => e
    count ||= 1
    retry unless (count = count.next) > 5
    CartoDB::notify_exception(e, user: user)
  end

  def run!
    self.update(state: 'started')
    table_geocoder.run
    self.update remote_id: table_geocoder.remote_id
    started = Time.now
    begin
      table_geocoder.geocoder.update_status
      self.update(
        processed_rows: table_geocoder.geocoder.processed_rows,
        total_rows: table_geocoder.geocoder.total_rows,
        state: table_geocoder.geocoder.status
      )
      puts "#{processed_rows}/#{total_rows}"
      raise "Geocoding timeout" if Time.now - started > 3.minutes and ['started', 'submitted', 'accepted'].include? state
      sleep(2)
    end until ['completed', 'cancelled', 'failed'].include? state
    return false if state == 'cancelled'
    table_geocoder.process_results
    create_automatic_geocoding if automatic_geocoding_id.blank?
    self.update(state: 'finished')
  rescue => e
    CartoDB::notify_exception(e, user: user)
    self.update(state: 'failed')
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
    return nil if user.blank? || user.account_type != 'FREE'
    user.geocoding_quota - user.get_geocoding_calls
  rescue
    nil
  end # max_geocodable_rows
end
