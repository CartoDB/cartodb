# encoding: utf-8

require_relative './style.rb'
require_relative '../definition.rb'

module Carto::Styles
  class Line < Style
    def initialize(style_type)
      @style_type = style_type

      super(style_type, default_definition)
    end

    def self.accepted_geometry_types
      ['line', 'multiline', 'linestring', 'multilinestring', 'st_multipoint', 'st_linestring', 'st_multilinestring']
    end

    def default_definition
      definition_location = @style_type == 'tvt' ? TVT_DEFINITION_LOCATION : CARTOGRAPHY_DEFINITION_LOCATION

      Carto::Definition.instance.load_from_file(definition_location)[:simple][:line]
    end

    private

    def parse_stroke(stroke, _)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      ["line-color: #{color};",
       "line-width: #{width};",
       "line-opacity: #{opacity};"]
    end
  end
end
