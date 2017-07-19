# encoding: utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Polygon < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    def self.accepted_geometry_types
      ['polygon', 'multipolygon', 'st_polygon', 'st_multipolygon']
    end

    def default_definition
      Carto::Definition.instance.load_from_file(CARTOGRAPHY_DEFINITION_LOCATION)[:simple][:polygon]
    end

    private

    def parse_fill(fill)
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      [
        "polygon-fill: #{color};",
        "polygon-opacity: #{opacity};"
      ]
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      [
        "::outline" => [
          "line-color: #{color};",
          "line-width: #{width};",
          "line-opacity: #{opacity};"
        ]
      ]
    end
  end
end
