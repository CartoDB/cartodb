# encoding: utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Line < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    def self.accepted_geometry_types
      ['line', 'multiline', 'linestring', 'multilinestring', 'st_multipoint', 'st_linestring', 'st_multilinestring']
    end

    def default_definition
      Carto::Definition.instance.load_from_file(CARTOGRAPHY_DEFINITION_LOCATION)[:simple][:line]
    end

    private

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      ["line-color: #{color};",
       "line-width: #{width};",
       "line-opacity: #{opacity};"]
    end
  end
end
