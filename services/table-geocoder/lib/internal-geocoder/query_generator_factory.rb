require_relative 'input_type_resolver'

require_relative 'cities_text_text_points'
require_relative 'cities_column_text_points'
require_relative 'cities_text_column_points'
require_relative 'cities_column_column_points'
require_relative 'admin0_text_polygons'
require_relative 'admin1_text_polygons'
require_relative 'admin1_column_polygons'
require_relative 'postalcode_text_points'
require_relative 'postalcode_column_points'
require_relative 'postalcode_text_polygon'
require_relative 'postalcode_column_polygon'
require_relative 'ipaddress_text_point'

module CartoDB
  module InternalGeocoder

    class QueryGeneratorFactory

      class QueryGeneratorNotImplemented < StandardError; end

      class << self
        private :new

        def get(internal_geocoder, input_type=nil)
          input_type ||= InputTypeResolver.new(internal_geocoder).type

          case input_type
            when [:namedplace, :text, nil, :point]
              CitiesTextTextPoints.new internal_geocoder
            when [:namedplace, :text, :text, :point]
              CitiesTextTextPoints.new internal_geocoder
            when [:namedplace, :text, :column, :point]
              CitiesTextColumnPoints.new internal_geocoder
            when [:namedplace, :column, nil, :point]
              CitiesColumnTextPoints.new internal_geocoder
            when [:namedplace, :column, :text, :point]
              CitiesColumnTextPoints.new internal_geocoder
            when [:namedplace, :column, :column, :point]
              CitiesColumnColumnPoints.new internal_geocoder
            when [:admin0, :text, nil, :polygon]
              Admin0TextPolygons.new internal_geocoder
            when [:admin1, :text, nil, :polygon]
              Admin1TextPolygons.new internal_geocoder
            when [:admin1, :column, nil, :polygon]
              Admin1ColumnPolygons.new internal_geocoder
            when [:postalcode, :text, nil, :point]
              PostalcodeTextPoints.new internal_geocoder
            when [:postalcode, :column, nil, :point]
              PostalcodeColumnPoints.new internal_geocoder
            when [:postalcode, :text, nil, :polygon]
              PostalcodeTextPolygon.new internal_geocoder
            when [:postalcode, :column, nil, :polygon]
              PostalcodeColumnPolygon. new internal_geocoder
            when [:ipaddress, :text, nil, :point]
              IpAddressTextPoint.new internal_geocoder
            else
              raise QueryGeneratorNotImplemented. new "QueryGenerator not implemented for input type #{input_type}"
          end
        end
      end


    end # QueryGeneratorFactory

  end # InternalGeocoder
end #CartoDB
