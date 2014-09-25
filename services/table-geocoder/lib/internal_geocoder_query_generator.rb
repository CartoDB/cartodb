# encoding: utf-8

module CartoDB

  class InternalGeocoderQueryGenerator

    def initialize(internal_geocoder)
      @internal_geocoder = internal_geocoder
    end

    def dataservices_query_template
      'WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, {country})).*) SELECT q, null, geom, success FROM geo_function'
    end

    def search_terms_query(page)
      %Q{
            SELECT DISTINCT(quote_nullable(#{@internal_geocoder.column_name})) AS searchtext
            FROM #{@internal_geocoder.qualified_table_name}
            WHERE cartodb_georef_status IS NULL
            LIMIT #{@internal_geocoder.batch_size} OFFSET #{page * @internal_geocoder.batch_size}
      }
    end
  end

end