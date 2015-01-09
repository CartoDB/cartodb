# encoding: utf-8

require_relative '../../lib/internal-geocoder/query_generator_factory.rb'

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
  - country: column, freetext
  - geometry_type: point, polygon

* Where queries are needed:
  - to query the data-services
  - to import results into table
=end

describe CartoDB::InternalGeocoder::QueryGeneratorFactory do

  before(:each) do
    @internal_geocoder = mock
  end

  describe '#dataservices' do

    it 'should return a query template suitable for <namedplace, freetext, point>' do
      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:namedplace, :text, :point])
      @internal_geocoder.expects('countries').once.returns(%Q{'Spain'})
      search_terms = [{city: %Q{'Madrid'}}, {city: %Q{'Granada'}}]

      query = query_generator.dataservices_query(search_terms)

      query.should == "WITH geo_function AS (SELECT (geocode_namedplace(Array['Madrid','Granada'], null, 'Spain')).*) SELECT q, null, geom, success FROM geo_function"
    end

  end

  describe '#search_terms_query' do
    it 'should get the search terms for <namedplace, freetext, point>' do
      @internal_geocoder.stubs('column_name').once.returns('city')
      @internal_geocoder.stubs('qualified_table_name').once.returns(%Q{"public"."untitled_table"})
      @internal_geocoder.stubs('batch_size').returns(5000)
      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:namedplace, :text, :point])

      query = query_generator.search_terms_query(0)

      query.squish.should == 'SELECT DISTINCT(trim(quote_nullable("city"))) AS city FROM "public"."untitled_table" WHERE cartodb_georef_status IS NULL LIMIT 5000 OFFSET 0'
    end
  end

  describe '#copy_results_to_table_query' do
    it 'should generate a suitable query to update geocoded table with temp table' do
      @internal_geocoder.stubs('qualified_table_name').returns(%Q{"public"."untitled_table"})
      @internal_geocoder.stubs('temp_table_name').once.returns('any_temp_table')
      @internal_geocoder.stubs('column_name').once.returns('any_column_name')
      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:namedplace, :text, :point])

      query = query_generator.copy_results_to_table_query

      query.squish.should == %Q{
        UPDATE "public"."untitled_table"
        SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
        #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
        FROM any_temp_table AS orig
        WHERE trim("any_column_name"::text) = orig.geocode_string AND "public"."untitled_table".cartodb_georef_status IS NULL
        #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
      }.squish
    end
  end

  describe 'CDB-4269' do
    it 'should generate a suitable query generator for [:admin1, :column, :polygon]' do
      @internal_geocoder.stubs('column_name').twice.returns('region_column_name')
      @internal_geocoder.stubs('qualified_table_name').returns('any_table_name')
      @internal_geocoder.stubs('country_column').twice.returns('country_column_name')
      @internal_geocoder.stubs('batch_size').twice.returns(10)
      @internal_geocoder.stubs('temp_table_name').once.returns('any_temp_tablename')

      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:admin1, :column, :polygon])

      query_generator.search_terms_query(0).squish.should == %Q{
        SELECT DISTINCT
          trim(quote_nullable(region_column_name)) as region,
          trim(quote_nullable(country_column_name)) as country
        FROM any_table_name
        WHERE cartodb_georef_status IS NULL
        LIMIT 10 OFFSET 0
      }.squish

      search_terms = [
        { region: %Q{'New York'}, country: %Q{'USA'}},
        { region: %Q{'Sucumbios'}, country: %Q{'Ecuador'}}
      ]

      query_generator.dataservices_query(search_terms).squish.should == %Q{
        WITH geo_function AS (SELECT (geocode_admin1_polygons(Array['New York','Sucumbios'], Array['USA','Ecuador'])).*)
        SELECT q, c, geom, success FROM geo_function
      }.squish

      query_generator.copy_results_to_table_query.squish.should == %Q{
        UPDATE any_table_name
          SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
          #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
          FROM any_temp_tablename AS orig
          WHERE trim(any_table_name.region_column_name::text) = orig.geocode_string
            AND trim(any_table_name.country_column_name::text) = orig.country
            AND any_table_name.cartodb_georef_status IS NULL
            #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
        }.squish
    end
  end

end
