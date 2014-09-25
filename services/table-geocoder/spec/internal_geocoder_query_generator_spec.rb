# encoding: utf-8

#TODO is this needed?
require 'rspec'

require_relative '../lib/internal_geocoder_query_generator.rb'
require_relative '../lib/internal_geocoder.rb'

RSpec.configure do |config|
  config.mock_with :mocha
end

class String
  # We just need this instead of adding the whole rails thing
  def squish
    self.split.join(' ')
  end
end

=begin
The class should generate queries to be used by the InternalGeocoder depending on the inputs.

* Different types of inputs:
  - kind: namedplace, ipaddress, postalcode, admin0, admin1
  - geometry_type: point, polygon
  - country: column, freetext

* Where queries are needed:
  - to query the data-services
  - to import results into table
=end

describe CartoDB::InternalGeocoderQueryGenerator do

  describe '#dataservices_query_template' do

    it 'should return a query template suitable for <namedplace, point, freetext>' do
      internal_geocoder = mock
      internal_geocoder.stubs('countries').once.returns('any_country')
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new(internal_geocoder)

      query = query_gen.dataservices_query_template

      query.should == 'WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, {country})).*) SELECT q, null, geom, success FROM geo_function'
    end

    it 'should replace "world" with null' do
      internal_geocoder = mock
      internal_geocoder.stubs('countries').once.returns("'world'")
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new(internal_geocoder)

      query = query_gen.dataservices_query_template

      query.should == 'WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, null)).*) SELECT q, null, geom, success FROM geo_function'
    end

  end

  describe '#search_terms_query' do
    it 'should get the search terms for <namedplace, point, freetext>' do
      internal_geocoder = mock
      internal_geocoder.stubs('column_name').once.returns('city')
      internal_geocoder.stubs('qualified_table_name').once.returns(%Q{"public"."untitled_table"})
      internal_geocoder.stubs('batch_size').returns(5000)
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new(internal_geocoder)

      query = query_gen.search_terms_query(0)

      query.squish.should == 'SELECT DISTINCT(quote_nullable(city)) AS searchtext FROM "public"."untitled_table" WHERE cartodb_georef_status IS NULL LIMIT 5000 OFFSET 0'
    end
  end

  describe '#copy_results_to_table_query' do
    it 'should generate a suitable query to update geocoded table with temp table' do
      internal_geocoder = mock
      internal_geocoder.stubs('qualified_table_name').once.returns(%Q{"public"."untitled_table"})
      internal_geocoder.stubs('temp_table_name').once.returns('any_temp_table')
      internal_geocoder.stubs('column_name').once.returns('any_column_name')
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new internal_geocoder

      query = query_gen.copy_results_to_table_query

      query.squish.should == %Q{
        UPDATE "public"."untitled_table" AS dest
        SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
        FROM any_temp_table AS orig
        WHERE any_column_name::text = orig.geocode_string AND dest.cartodb_georef_status IS NULL
      }.squish
    end
  end

  describe '#input_type' do
    it 'should return an array characterizing the inputs for <namedplace, point, freetext>' do
      internal_geocoder = mock
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new internal_geocoder

      query_gen.input_type.should == {
        :kind => :namedplace,
        :geometry_type => :point,
        :country => :freetext
      }
    end
  end

end