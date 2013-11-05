# encoding: UTF-8'
require_relative '../../services/table-geocoder/lib/table_geocoder'

class Geocoding < Sequel::Model

  many_to_one :user

  attr_reader :table_geocoder

  def validate
    super
    validates_presence :formatter
    validates_presence :table_name
  end # validate

  def after_initialize
    super
    instantiate_table_geocoder
  end #after_initialize

  def instantiate_table_geocoder
    @table_geocoder = CartoDB::TableGeocoder.new(Cartodb.config[:geocoder].symbolize_keys.merge(
      table_name: table_name,
      formatter:  translate_formatter,
      connection: (user.present? ? user.in_database(as: :superuser) : nil),
      remote_id:  remote_id,
      max_rows:   max_geocodable_rows
    ))
  end # instantiate_table_geocoder

  def before_save
    super
    self.updated_at = Time.now
    cancel if state == 'cancelled'
  end # before_save

  def cancel
    table_geocoder.cancel
  end

  def run!
    self.update(state: 'started')
    table_geocoder.run
    self.update remote_id: table_geocoder.remote_id
    begin
      table_geocoder.geocoder.update_status
      self.update(
        processed_rows: table_geocoder.geocoder.processed_rows,
        total_rows: table_geocoder.geocoder.total_rows,
        state: table_geocoder.geocoder.status
      )
      puts "#{processed_rows}/#{total_rows}"
      sleep(2)
    end until ['completed', 'cancelled'].include? state
    return false if state == 'cancelled'
    table_geocoder.process_results
    self.update(state: 'finished')
  end # run!

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
