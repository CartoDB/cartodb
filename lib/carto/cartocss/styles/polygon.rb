# encoding utf-8

require_relative './style.rb'
require_relative '../cartography.rb'

module Carto::CartoCSS::Styles
  class Polygon < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    private

    def default_definition
      Carto::CartoCSS::Cartography.new.to_hash[:simple][:polygon]
    end

    def parse_fill(fill)
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      "  polygon-fill: #{color};\n"\
      "  polygon-opacity: #{opacity};\n"\
      "  polygon-gamma: 0.5;\n"
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      "  line-width: #{width};\n"\
      "  line-color: #{color};\n"\
      "  line-opacity: #{opacity};\n"\
      "  line-comp-op: soft-light;\n"
    end
  end
end
