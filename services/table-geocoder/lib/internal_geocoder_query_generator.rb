# encoding: utf-8

module CartoDB

  class InternalGeocoderQueryGenerator

    def initialize(internal_geocoder)
      @internal_geocoder = internal_geocoder
    end

    def dataservices_query_template
      country_clause = @internal_geocoder.countries == "'world'" ? 'null' : '{country}'
      %Q{WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, #{country_clause})).*) SELECT q, null, geom, success FROM geo_function}
    end

    def search_terms_query(page)
      %Q{
            SELECT DISTINCT(quote_nullable(#{@internal_geocoder.column_name})) AS searchtext
            FROM #{@internal_geocoder.qualified_table_name}
            WHERE cartodb_georef_status IS NULL
            LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
      }
    end

    def copy_results_to_table_query
      %Q{
          UPDATE #{@internal_geocoder.qualified_table_name} AS dest
          SET the_geom = orig.the_geom, cartodb_georef_status = orig.cartodb_georef_status
          FROM #{@internal_geocoder.temp_table_name} AS orig
          WHERE #{@internal_geocoder.column_name}::text = orig.geocode_string AND dest.cartodb_georef_status IS NULL
      }
    end

    def input_type
      {
        :kind => kind,
        :geometry_type => geometry_type,
        :country => country_input_type
      }
    end

    def kind
      :namedplace
    end

    def geometry_type
      :point
    end

    def country_input_type
      :freetext
    end

  end

end