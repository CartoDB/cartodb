# encoding: utf-8

require_relative 'internal_geocoder_input_type_resolver'

module CartoDB

  class InternalGeocoderQueryGenerator

    def initialize(internal_geocoder, input_type=nil)
      @internal_geocoder = internal_geocoder
      @input_type = input_type || CartoDB::InternalGeocoderInputTypeResolver.new(@internal_geocoder).type
    end

    def dataservices_query_template
      case @input_type
        when [:namedplace, :point, :freetext]
          country_clause = @internal_geocoder.countries == "'world'" ? 'null' : '{country}'
          "WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, #{country_clause})).*) SELECT q, null, geom, success FROM geo_function"
        when [:namedplace, :point, :column]
          'WITH geo_function AS (SELECT (geocode_namedplace(Array[{search_terms}], null, {country_list})).*) SELECT q, null, geom, success FROM geo_function'
        else
          #TODO use a custom exception
          raise "Not implemented"
      end
    end

    def search_terms_query(page)
      case @input_type
        when [:namedplace, :point, :freetext]
          %Q{
            SELECT DISTINCT(quote_nullable(#{@internal_geocoder.column_name})) AS searchtext
            FROM #{@internal_geocoder.qualified_table_name}
            WHERE cartodb_georef_status IS NULL
            LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
          }
        when [:namedplace, :point, :column]
          #TODO review this query
          %Q{
            SELECT DISTINCT(quote_nullable(#{@internal_geocoder.column_name}), quote_nullable(#{@internal_geocoder.country_column}))
            AS searchtext, country
            FROM #{@internal_geocoder.qualified_table_name}
            WHERE cartodb_georef_status IS NULL
            LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
          }
        else
          raise "Not implemented"
      end
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

  end

end