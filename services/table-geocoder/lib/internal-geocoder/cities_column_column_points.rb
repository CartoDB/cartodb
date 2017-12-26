# encoding: utf-8

require_relative 'abstract_query_generator'

module CartoDB
  module InternalGeocoder

    class CitiesColumnColumnPoints < AbstractQueryGenerator

      def search_terms_query(page)
        %Q{
          SELECT DISTINCT
            trim(quote_nullable("#{@internal_geocoder.column_name}")) AS city,
            trim(quote_nullable(#{@internal_geocoder.country_column})) AS country,
            trim(quote_nullable(#{@internal_geocoder.region_column})) AS region
          FROM #{@internal_geocoder.qualified_table_name}
          WHERE cartodb_georef_status IS NULL
          LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
        }
      end

      def dataservices_query(search_terms)
        cities = search_terms.map { |row| row[:city] }.join(',')
        regions = search_terms.map { |row| row[:region] }.join(',')
        countries = search_terms.map { |row| row[:country] }.join(',')
        "WITH geo_function AS (SELECT (geocode_namedplace(Array[#{cities}], Array[#{regions}], Array[#{countries}])).*) SELECT q, c, a1, geom, success FROM geo_function"
      end

      def copy_results_to_table_query
        %Q{
          UPDATE #{dest_table} AS dest
          SET the_geom = CASE WHEN orig.cartodb_georef_status THEN orig.the_geom ELSE dest.the_geom END,
              cartodb_georef_status = orig.cartodb_georef_status
          FROM #{@internal_geocoder.temp_table_name} AS orig
          WHERE trim(dest."#{@internal_geocoder.column_name}"::text) = trim(orig.geocode_string)
            AND trim(dest.#{@internal_geocoder.country_column}::text) = trim(orig.country)
            AND trim(dest.#{@internal_geocoder.region_column}::text) = trim(orig.region)
            AND dest.cartodb_georef_status IS NULL
        }
      end

    end # CitiesColumnColumnPoints

  end # InternalGeocoder
end # CartoDB
