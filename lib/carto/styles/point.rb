# encoding: utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Point < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    def self.accepted_geometry_types
      ['point', 'multipoint', 'st_point']
    end

    def default_definition
      Carto::Definition.instance.load_from_file(CARTOGRAPHY_DEFINITION_LOCATION)[:simple][:point]
    end

    private

    def parse_fill(fill)
      width = fill[:size][:fixed]
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      ["dot-width: #{width};",
       "dot-fill: #{color};",
       "dot-opacity: #{opacity};"]
    end

    def parse_stroke(stroke, fill)
      width = (stroke[:size][:fixed] + fill[:size][:fixed])
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      [
        "::outline" => [
          "dot-fill: #{color};",
          "dot-width: #{width};",
          "dot-opacity: #{opacity};"
        ]
      ]
    end
  end
end
