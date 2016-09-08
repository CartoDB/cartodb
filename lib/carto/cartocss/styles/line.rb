# encoding utf-8

require_dependency 'carto/cartocss/styles/style'
require_dependency 'carto/cartocss/cartography'

module Carto::CartoCSS::Styles
  class Line < Style
    def initialize(definition: default_definition)
      super(definition)
    end

    private

    def default_definition
      Carto::CartoCSS::Cartography.new.to_hash[:simple][:line]
    end

    def parse_stroke(stroke)
      width = stroke[:size][:fixed]
      color = stroke[:color][:fixed]
      opacity = stroke[:color][:opacity]

      "\tline-width: #{width};\n"\
      "\tline-color: #{color};\n"\
      "\tline-opacity: #{opacity};\n"
    end
  end
end
