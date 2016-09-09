# encoding utf-8

require_relative '../presenter'

module Carto
  module CartoCSS
    module Styles
      class Style
        def initialize(definition)
          @definition = definition
        end

        def to_cartocss_array
          return '' unless @definition
          return @cartocss if @cartocss

          @cartocss_array = @definition.map do |key, value|
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

          @cartocss_array.flatten
        end

        def to_cartocss
          Carto::CartoCSS::Presenter.new(cartocss_array: to_cartocss_array).to_s
        end

        def self.accepted_geometry_types
          return @accepted_geometry_types if @accepted_geometry_types

          descendant_accepted_types = descendants.map(&:accepted_geometry_types)

          @accepted_geometry_types = descendant_accepted_types.flatten
        end

        def self.style_for_geometry_type(geometry_type)
          accepted_descendants = descendants.select do |descendant|
            descendant.accepted_geometry_types.include?(geometry_type.downcase)
          end

          accepted_descendants.first
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
