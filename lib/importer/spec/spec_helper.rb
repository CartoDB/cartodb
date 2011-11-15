# coding: UTF-8

require 'rubygems'
require 'bundler'
Bundler.setup
require 'sequel'

require File.expand_path("../support/database_connection", __FILE__)

RSpec.configure do |config|
  config.mock_with :mocha
  
  config.before(:each) do
    CartoDB::DatabaseConnection.connection.tables.each do |t| 
      next if %W{ raster_columns raster_overviews geography_columns geometry_columns spatial_ref_sys }.include?(t.to_s)
      CartoDB::DatabaseConnection.connection.drop_table(t)
    end
  end
end
