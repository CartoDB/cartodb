# encoding utf-8

require_relative './style.rb'
require_relative '../cartography.rb'

module Carto::CartoCSS::Styles
  class Line < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    def self.accepted_geometry_types
      ['line', 'multiline', 'linestring', 'multilinestring']
    end

    private

    def default_definition
      Carto::CartoCSS::Cartography.instance.to_hash[:simple][:line]
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      ["line-width: #{width};",
       "line-color: #{color};",
       "line-opacity: #{opacity};"]
    end
  end
end
