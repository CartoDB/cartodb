# encoding utf-8

require_dependency 'carto/cartocss/styles/style'
require_dependency 'carto/cartocss/cartography'

module Carto::CartoCSS::Styles
  class Point < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    private

    def default_definition
      Carto::CartoCSS::Cartography.new.to_hash[:simple][:point]
    end

    def parse_fill(fill)
      width = fill[:size][:fixed]
      color = fill[:color][:fixed]
      opacity = fill[:color][:opacity]

      "\tmarker-width: #{width};\n"\
      "\tmarker-fill: #{color};\n"\
      "\tmarker-fill-opacity: #{opacity};\n"
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      "\tmarker-line-width: #{width};\n"\
      "\tmarker-line-color: #{color};\n"\
      "\tmarker-line-opacity: #{opacity};\n"\
      "\tmarker-placement: point;\n"\
      "\tmarker-type: ellipse;\n"\
      "\tmarker-allow-overlap: true;\n"
    end
  end
end
