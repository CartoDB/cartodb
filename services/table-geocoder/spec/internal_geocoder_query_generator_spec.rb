# encoding: utf-8

#TODO is this needed?
require 'rspec'

require_relative '../lib/internal_geocoder_query_generator.rb'
require_relative '../lib/internal_geocoder.rb'

RSpec.configure do |config|
  config.mock_with :mocha
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
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new(internal_geocoder)
      query = query_gen.dataservices_query_template
      query.should == 'WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, {country})).*) SELECT q, null, geom, success FROM geo_function'
    end

    it 'should replace "world" with null' do
      pending('TBD')
    end

  end

  describe '#search_terms_query' do
    it 'should get the search terms for <namedplace, point, freetext>' do
      internal_geocoder = mock
      internal_geocoder.stubs('column_name').once.returns('city')
      internal_geocoder.stubs('qualified_table_name').once.returns('"public"."untitled_table"')
      internal_geocoder.stubs('batch_size').returns(5000)
      query_gen = CartoDB::InternalGeocoderQueryGenerator.new(internal_geocoder)

      query = query_gen.search_terms_query(0)
      #TODO replace by squish or just copy the template
      query.strip.gsub(/[\s\n]+/, ' ').should == 'SELECT DISTINCT(quote_nullable(city)) AS searchtext FROM "public"."untitled_table" WHERE cartodb_georef_status IS NULL LIMIT 5000 OFFSET 0'
    end
  end

end