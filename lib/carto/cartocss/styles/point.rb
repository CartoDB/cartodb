# encoding utf-8

require_relative './style.rb'
require_relative '../cartography.rb'

module Carto::CartoCSS::Styles
  class Point < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    def self.accepted_geometry_types
      ['point', 'multipoint']
    end

    private

    def default_definition
      Carto::CartoCSS::Cartography.new.to_hash[:simple][:point]
    end

    def parse_fill(fill)
      width = fill[:size][:fixed]
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      "  marker-width: #{width};\n"\
      "  marker-fill: #{color};\n"\
      "  marker-fill-opacity: #{opacity};"
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      "  marker-line-width: #{width};\n"\
      "  marker-line-color: #{color};\n"\
      "  marker-line-opacity: #{opacity};\n"\
      "  marker-placement: point;\n"\
      "  marker-type: ellipse;\n"\
      "  marker-allow-overlap: true;"
    end
  end
end
