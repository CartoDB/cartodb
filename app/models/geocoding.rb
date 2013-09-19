# encoding: UTF-8'
require_relative '../../services/table-geocoder/lib/table_geocoder'

class Geocoding < Sequel::Model

  many_to_one :user

  attr_reader :table_geocoder

  def after_initialize
    super
    instantiate_table_geocoder
  end #after_initialize

  def instantiate_table_geocoder
    @table_geocoder = CartoDB::TableGeocoder.new(Cartodb.config[:geocoder].symbolize_keys.merge(
      table_name: table_name,
      formatter:  formatter,
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
    until table_geocoder.geocoder.status == 'completed' do
      table_geocoder.geocoder.update_status
      self.update(
        processed_rows: table_geocoder.geocoder.processed_rows,
        total_rows: table_geocoder.geocoder.total_rows
      )
      puts "#{processed_rows}/#{total_rows}"
      sleep(2)
    end
    table_geocoder.download_results
    table_geocoder.deflate_results
    table_geocoder.create_temp_table
    table_geocoder.import_results_to_temp_table
    table_geocoder.load_results_into_original_table
  end # run_geocoding!
end
