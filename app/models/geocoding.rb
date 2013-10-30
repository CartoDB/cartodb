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
      remote_id:  remote_id
    ))
  end # instantiate_table_geocoder

  def before_save
    super
    self.updated_at = Time.now
  end # before_save

  def run!
    table_geocoder.run
    self.update remote_id: table_geocoder.remote_id
    begin
      table_geocoder.geocoder.update_status
      self.update(
        processed_rows: table_geocoder.geocoder.processed_rows,
        total_rows: table_geocoder.geocoder.total_rows
      )
      puts "#{processed_rows}/#{total_rows}"
      sleep(2)
    end until table_geocoder.geocoder.status == 'completed'
    table_geocoder.process_results
  end # run_geocoding!

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
end
