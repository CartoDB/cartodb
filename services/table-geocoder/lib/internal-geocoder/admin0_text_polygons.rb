# encoding: utf-8

require_relative 'abstract_query_generator'

module CartoDB
  module InternalGeocoder

    class Admin0TextPolygons < AbstractQueryGenerator

      def search_terms_query(page)
        %Q{
          SELECT DISTINCT(trim(quote_nullable("#{@internal_geocoder.column_name}"))) AS region
          FROM #{@internal_geocoder.qualified_table_name}
          WHERE cartodb_georef_status IS NULL
          LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
        }
      end

      def dataservices_query(search_terms)
        regions = search_terms.map { |row| row[:region] }.join(',')
        "WITH geo_function AS (SELECT (geocode_admin0_polygons(Array[#{regions}])).*) SELECT q, null AS c, null AS a1, geom, success FROM geo_function"
      end

      def copy_results_to_table_query
        %Q{
          UPDATE #{dest_table} AS dest
          SET the_geom = CASE WHEN orig.cartodb_georef_status THEN orig.the_geom ELSE dest.the_geom END,
              cartodb_georef_status = orig.cartodb_georef_status
          FROM #{@internal_geocoder.temp_table_name} AS orig
          WHERE trim(dest."#{@internal_geocoder.column_name}"::text) = trim(orig.geocode_string) AND dest.cartodb_georef_status IS NULL
        }
      end

    end # Admin0TextPolygons

  end # InternalGeocoder
end # CartoDB
