# encoding: utf-8

require_relative 'input_type_resolver'

require_relative 'cities_text_points'
require_relative 'cities_column_points'
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
            when [:namedplace, :text, :point]
              CitiesTextPoints.new internal_geocoder
            when [:namedplace, :column, :point]
              CitiesColumnPoints.new internal_geocoder
            when [:admin0, :text, :polygon]
              Admin0TextPolygons.new internal_geocoder
            when [:admin1, :text, :polygon]
              Admin1TextPolygons.new internal_geocoder
            when [:admin1, :column, :polygon]
              Admin1ColumnPolygons.new internal_geocoder
            when [:postalcode, :text, :point]
              PostalcodeTextPoints.new internal_geocoder
            when [:postalcode, :column, :point]
              PostalcodeColumnPoints.new internal_geocoder
            when [:postalcode, :text, :polygon]
              PostalcodeTextPolygon.new internal_geocoder
            when [:postalcode, :column, :polygon]
              PostalcodeColumnPolygon. new internal_geocoder
            when [:ipaddress, :text, :point]
              IpAddressTextPoint.new internal_geocoder
            else
              raise QueryGeneratorNotImplemented. new "QueryGenerator not implemented for input type #{input_type}"
          end
        end
      end


    end # QueryGeneratorFactory

  end # InternalGeocoder
end #CartoDB
