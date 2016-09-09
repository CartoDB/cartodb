# encoding utf-8

module Carto
  module CartoCSS
    class Presenter
      CARTOCSS_PROPERTY_INDENTATION = '  '.freeze

      def initialize(class_name: 'layer', cartocss_array: [])
        @class_name = class_name
        @cartocss_array = cartocss_array
      end

      def to_s
        "##{@class_name} {\n"\
        "#{formatted_cartocss_body}\n"\
        "}"
      end

      private

      def formatted_cartocss_body
        formatted_cartocss_properties = @cartocss_array.map do |cartocss_property|
          format_cartocss_property(cartocss_property)
        end

        formatted_cartocss_properties.join("\n")
      end

      def format_cartocss_property(cartocss_property)
        "#{CARTOCSS_PROPERTY_INDENTATION}#{cartocss_property}"
      end
    end
  end
end
