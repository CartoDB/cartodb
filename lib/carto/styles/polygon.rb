# encoding: utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Polygon < Style
    def initialize(style_type)
      @style_type = style_type

      super(style_type, default_definition)
    end

    def self.accepted_geometry_types
      ['polygon', 'multipolygon', 'st_polygon', 'st_multipolygon']
    end

    def default_definition
      definition_location = @style_type == 'tvt' ? TVT_DEFINITION_LOCATION : CARTOGRAPHY_DEFINITION_LOCATION

      Carto::Definition.instance.load_from_file(definition_location)[:simple][:polygon]
    end

    private

    def parse_fill(fill, _)
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      ["polygon-fill: #{color};",
       "polygon-opacity: #{opacity};",
       "polygon-gamma: 0.5;"]
    end

    def parse_stroke(stroke, _)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      ["line-color: #{color};",
       "line-width: #{width};",
       "line-opacity: #{opacity};",
       "line-comp-op: soft-light;"]
    end
  end
end
