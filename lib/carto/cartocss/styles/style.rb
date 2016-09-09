# encoding utf-8

module Carto
  module CartoCSS
    module Styles
      class Style
        EMTPY_CARTOCSS = '#empty{}'.freeze

        def initialize(definition)
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

          "#layer {\n"\
          "#{@cartocss.join}"\
          "}"
        end

        def self.accepted_geometry_types
          return @accepted_geometry_types if @accepted_geometry_types

          descendant_accepted_types = descendants.map(&:accepted_geometry_types)

          @accepted_geometry_types = descendant_accepted_types.flatten
        end

        private

        def parse_fill(_)
          ''
        end

        def parse_stroke(_)
          ''
        end
      end
    end
  end
end
