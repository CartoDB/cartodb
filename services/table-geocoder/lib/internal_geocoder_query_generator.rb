# encoding: utf-8

module CartoDB

  class InternalGeocoderQueryGenerator
    def dataservices_querytemplate
      'WITH geo_function AS (SELECT (geocode_namedplace(Array[{cities}], null, {country})).*) SELECT q, null, geom, success FROM geo_function'
    end
  end

end