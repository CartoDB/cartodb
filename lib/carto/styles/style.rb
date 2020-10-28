require_relative './presenters/cartocss'

module Carto
  module Styles
    class Style
      include ::LoggerHelper

      CARTOGRAPHY_DEFINITION_LOCATION =
        "#{Rails.root}/lib/assets/javascripts/builder/data/default-cartography.json".freeze

      def initialize(definition)
        @definition = definition
      end

      def to_cartocss_array
        return [] unless @definition
        return @cartocss_array if @cartocss_array

        nested_cartocss_array = @definition.map do |key, value|
          case key.to_s
          when 'fill'
            parse_fill(value)
          when 'stroke'
            parse_stroke(value)
          else
            log_warning(
              message: 'Carto::Styles: Tried parsing an unkown attribute',
              attribute: key, definition: @definition
            )
          end
        end

        @cartocss_array = nested_cartocss_array.flatten
      end

      def to_cartocss
        Carto::Styles::Presenters::CartoCSS.new(cartocss_array: to_cartocss_array).to_s
      end

      def self.accepted_geometry_types
        return @accepted_geometry_types if @accepted_geometry_types

        descendant_accepted_types = descendants.map(&:accepted_geometry_types)

        @accepted_geometry_types = descendant_accepted_types.flatten
      end

      def self.style_for_geometry_type(geometry_type)
        return unless geometry_type

        accepted_descendants = descendants.select do |descendant|
          descendant.accepted_geometry_types.include?(geometry_type.downcase)
        end

        accepted_descendants.first
      end

      private

      # NOTE: This method should be overwritten by child classes if needed
      def parse_fill(_)
        []
      end

      # NOTE: This method should be overwritten by child classes if needed
      def parse_stroke(_)
        []
      end
    end
  end
end
