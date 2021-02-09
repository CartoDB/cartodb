require_relative '../../lib/internal-geocoder/query_generator_factory.rb'
require_relative '../../lib/internal-geocoder/abstract_query_generator.rb'
require          'active_support/core_ext' # Needed for string.blank?

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

    it 'should return a query template suitable for <namedplace, country_name, region_name, point>' do
      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:namedplace, :text, :text, :point])
      query_generator.should be_a_kind_of CartoDB::InternalGeocoder::AbstractQueryGenerator
      @internal_geocoder.expects('countries').once.returns(%Q{'Spain'})
      @internal_geocoder.expects('regions').once.returns(%Q{'Madrid'})
      search_terms = [{city: %Q{'Madrid'}}, {city: %Q{'Granada'}}]

      query = query_generator.dataservices_query(search_terms)

      query.should == "WITH geo_function AS (SELECT (geocode_namedplace(Array['Madrid','Granada'], 'Madrid', 'Spain')).*) SELECT q, c, a1, geom, success FROM geo_function"
    end

  end

  describe '#search_terms_query' do
    it 'should get the search terms for <namedplace, country_name, region_name, point>' do
      @internal_geocoder.stubs('column_name').once.returns('city')
      @internal_geocoder.stubs('qualified_table_name').once.returns(%Q{"public"."untitled_table"})
      @internal_geocoder.stubs('batch_size').returns(5000)
      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:namedplace, :text, :text, :point])

      query = query_generator.search_terms_query(0)

      query.squish.should == 'SELECT DISTINCT(trim(quote_nullable("city"))) AS city FROM "public"."untitled_table" WHERE cartodb_georef_status IS NULL LIMIT 5000 OFFSET 0'
    end
  end

  describe '#copy_results_to_table_query' do
    it 'should generate a suitable query to update geocoded table with temp table' do
      @internal_geocoder.stubs('qualified_table_name').returns(%Q{"public"."untitled_table"})
      @internal_geocoder.stubs('temp_table_name').once.returns('any_temp_table')
      @internal_geocoder.stubs('column_name').once.returns('any_column_name')
      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:namedplace, :text, :text, :point])

      query = query_generator.copy_results_to_table_query

      query.squish.should == %Q{
        UPDATE "public"."untitled_table" AS dest
        SET the_geom = CASE WHEN orig.cartodb_georef_status THEN orig.the_geom ELSE dest.the_geom END,
            cartodb_georef_status = orig.cartodb_georef_status
        FROM any_temp_table AS orig
        WHERE trim(dest."any_column_name"::text) = trim(orig.geocode_string) AND dest.cartodb_georef_status IS NULL
      }.squish
    end
  end

  describe 'CDB-4269' do
    it 'should generate a suitable query generator for [:admin1, :column, nil, :polygon]' do
      @internal_geocoder.stubs('column_name').twice.returns('region_column_name')
      @internal_geocoder.stubs('qualified_table_name').returns('any_table_name')
      @internal_geocoder.stubs('country_column').twice.returns('country_column_name')
      @internal_geocoder.stubs('batch_size').twice.returns(10)
      @internal_geocoder.stubs('temp_table_name').once.returns('any_temp_tablename')

      query_generator = CartoDB::InternalGeocoder::QueryGeneratorFactory.get(@internal_geocoder, [:admin1, :column, nil, :polygon])

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
        SELECT q, c, null AS a1, geom, success FROM geo_function
      }.squish

      query_generator.copy_results_to_table_query.squish.should == %Q{
        UPDATE any_table_name AS dest
          SET the_geom = CASE WHEN orig.cartodb_georef_status THEN orig.the_geom ELSE dest.the_geom END,
              cartodb_georef_status = orig.cartodb_georef_status
          FROM any_temp_tablename AS orig
          WHERE trim(dest.region_column_name::text) = trim(orig.geocode_string)
            AND trim(dest.country_column_name::text) = trim(orig.country)
            AND dest.cartodb_georef_status IS NULL
        }.squish
    end
  end

end
