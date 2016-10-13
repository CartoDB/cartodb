# encoding utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Geometry < Style
    def initialize
      super(nil)
    end

    def self.accepted_geometry_types
      ['geometry', 'st_geometry']
    end

    NAMES_CLASSES_MAP = {
      "layer['mapnik::geometry_type' = 1]" => Carto::Styles::Point,
      "layer['mapnik::geometry_type' = 2]" => Carto::Styles::Line,
      "layer['mapnik::geometry_type' = 3]" => Carto::Styles::Polygon
    }.freeze

    def to_cartocss
      cartocss_classes = NAMES_CLASSES_MAP.keys.map do |class_name|
        cartocss_array = NAMES_CLASSES_MAP[class_name].new.to_cartocss_array
        Carto::Styles::Presenters::CartoCSS.new(cartocss_array: cartocss_array,
                                                class_name: class_name)
                                           .to_s + "\n"
      end

      cartocss_classes.join
    end

    def default_definition
      definition_instance = Carto::Definition.instance
      definition = definition_instance
                   .load_from_file(CARTOGRAPHY_DEFINITION_LOCATION)

      definition[:simple][:point]
    end
  end
end
