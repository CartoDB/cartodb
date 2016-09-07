# encoding utf-8

module Carto
  module CartoCSS
    class Style
      EMTPY_CARTOCSS = '#empty{}'.freeze

      def initialize(geometry_type, definition)
        @geometry_type = geometry_type
        @definition = definition
      end

      def to_cartocss
        return EMTPY_CARTOCSS unless @definition
        return @cartocss if @cartocss

        @cartocss = ''

        @cartocss = @definition.map do |key, value|
          case key.to_s
          when 'fill'
            parse_fill(value)
          when 'stroke'
            parse_stroke(value)
          else
            CartoDB::Logger.warning(message: 'Carto::CartoCSS: Tried parsing an unkown attribute',
                                    attribute: key,
                                    definition: @definition)
          end
        end

        @cartocss.join
      end
    end

    class Point < Style
      def initialize(definition)
        super('point', definition)
      end

      def parse_fill(fill)
        width = fill[:size][:fixed]
        color = fill[:color][:fixed]
        opacity = fill[:color][:opacity]

        "marker-width: #{width};\n"\
        "marker-fill: #{color};\n"\
        "marker-fill-opacity: #{opacity};\n"
      end

      def parse_stroke(stroke)
        width = stroke[:size][:fixed]
        color = stroke[:color][:fixed]
        opacity = stroke[:color][:opacity]

        "marker-line-width: #{width};\n"\
        "marker-line-color: #{color};\n"\
        "marker-line-opacity: #{opacity};\n"
      end
    end

    class LineOrPolygon < Style
      def initialize(definition)
        super('line', definition)
      end

      def parse_fill(fill)
        color = fill[:color][:fixed]
        opacity = fill[:color][:opacity]

        "marker-fill: #{color};\n"\
        "marker-fill-opacity: #{opacity};\n"
      end

      def parse_stroke(stroke)
        width = stroke[:size][:fixed]
        color = stroke[:color][:fixed]
        opacity = stroke[:color][:opacity]

        "line-width: #{width};\n"\
        "line-color: #{color};\n"\
        "line-opacity: #{opacity};\n"
      end
    end
  end
end
