# encoding utf-8

require_relative './style.rb'

module Carto::Styles
  class Geometry < Style
    def initialize
      super(nil)
    end

    def self.accepted_geometry_types
      ['geometry', 'st_geometry']
    end

    def to_cartocss
      names_classes_map = {
        "layer['mapnik::geometry_type' = 1]" => Carto::Styles::Point,
        "layer['mapnik::geometry_type' = 2]" => Carto::Styles::Line,
        "layer['mapnik::geometry_type' = 3]" => Carto::Styles::Polygon
      }

      cartocss_classes = names_classes_map.keys.map do |class_name|
        cartocss_array = names_classes_map[class_name].new.to_cartocss_array
        Carto::Styles::Presenters::CartoCSS.new(cartocss_array: cartocss_array,
                                                class_name: class_name)
                                           .to_s + "\n"
      end

      cartocss_classes.join
    end
  end
end
