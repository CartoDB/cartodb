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
    @table_geocoder = CartoDB::TableGeocoder.new(
      table_name: table_name,
      formatter:  formatter,
      connection: (user.present? ? user.in_database : nil),
      remote_id:  remote_id,
      app_id: '',
      token:  '',
      mailto: ''
    )
  end # instantiate_table_geocoder

  def before_save
    super
    self.updated_at = Time.now
  end # before_save

  def run_geocoding!
    table_geocoder.run
    self.update remote_id: table_geocoder.remote_id
  end # run_geocoding!
end
