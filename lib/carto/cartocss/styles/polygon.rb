# encoding utf-8

require_dependency 'carto/cartocss/styles/style'
require_dependency 'carto/cartocss/cartography'

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

      "\tpolygon-fill: #{color};\n"\
      "\tpolygon-opacity: #{opacity};\n"\
      "\tpolygon-gamma: 0.5;\n"
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      "\tline-width: #{width};\n"\
      "\tline-color: #{color};\n"\
      "\tline-opacity: #{opacity};\n"\
      "\tline-comp-op: soft-light;\n"
    end
  end
end
