# encoding: utf-8

require_relative 'internal_geocoder_input_type_resolver'

module CartoDB
  module InternalGeocoder

    class QueryGenerator

      #TODO Generalize and check that all pieces fit together
      #TODO This looks like to be better solved with inheritance and a factory
      def initialize(internal_geocoder, input_type=nil)
        @internal_geocoder = internal_geocoder
        @input_type = input_type || CartoDB::InternalGeocoder::InputTypeResolver.new(@internal_geocoder).type
      end

      def search_terms_query(page)
        case @input_type
          when [:namedplace, :point, :freetext]
            %Q{
              SELECT DISTINCT(quote_nullable(#{@internal_geocoder.column_name})) AS city
              FROM #{@internal_geocoder.qualified_table_name}
              WHERE cartodb_georef_status IS NULL
              LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
            }
          when [:namedplace, :point, :column]
            %Q{
              SELECT DISTINCT
                quote_nullable(#{@internal_geocoder.column_name}) as city,
                quote_nullable(#{@internal_geocoder.country_column}) as country
              FROM #{@internal_geocoder.qualified_table_name}
              WHERE cartodb_georef_status IS NULL
              LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
            }
          else
            raise "Not implemented"
        end
      end

      def post_process_search_terms_query(results)
        case @input_type
          when [:namedplace, :point, :freetext]
            results.map { |r| r[:city] }
          when [:namedplace, :point, :column]
            results
          else
            raise "Not implemented"
        end
      end

      def dataservices_query_template
        case @input_type
          when [:namedplace, :point, :freetext]
            country_clause = @internal_geocoder.countries == "'world'" ? 'null' : '{country}'
            "WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, #{country_clause})).*) SELECT q, null, geom, success FROM geo_function"
          when [:namedplace, :point, :column]
            'WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, Array[{countries}])).*) SELECT q, null, geom, success FROM geo_function'
          else
            #TODO use a custom exception
            raise "Not implemented"
        end
      end

      def dataservices_query_instance(template, search_terms)
        #TODO merge this with query_template?
        nil # TODO
      end

      def copy_results_to_table_query
        case @input_type
          when [:namedplace, :point, :freetext]
            %Q{
              UPDATE #{@internal_geocoder.qualified_table_name} AS dest
              SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
              FROM #{@internal_geocoder.temp_table_name} AS orig
              WHERE #{@internal_geocoder.column_name}::text = orig.geocode_string AND dest.cartodb_georef_status IS NULL
            }
          when [:namedplace, :point, :column]
            #TODO redo this query
            %Q{
              UPDATE #{@internal_geocoder.qualified_table_name} AS dest
              SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
              FROM #{@internal_geocoder.temp_table_name} AS orig
              WHERE #{@internal_geocoder.column_name}::text = orig.geocode_string AND dest.cartodb_georef_status IS NULL
            }
          else
            raise "Not implemented"
        end
      end

    end # QueryGenerator

  end # InternalGeocoder
end