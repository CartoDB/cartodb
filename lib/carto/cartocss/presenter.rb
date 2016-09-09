# encoding utf-8

module Carto
  module CartoCSS
    class Presenter
      CARTOCSS_PROPERTY_INDENTATION = '  '.freeze

      def initialize(class_name: 'layer', cartocss_blocks: [])
        @class_name = class_name
        @cartocss_blocks = cartocss_blocks
      end

      def to_s
        "##{@class_name} {\n"\
        "#{formatted_cartocss_blocks}\n"\
        "}"
      end

      private

      def formatted_cartocss_blocks
        formatted_cartocss_blocks = @cartocss_blocks.map do |cartocss_block|
          format_cartocss_block(cartocss_block)
        end

        formatted_cartocss_blocks.join("\n")
      end

      def format_cartocss_block(block)
        formatted_properties = block.lines.map do |property|
          format_property(property)
        end

        formatted_properties.join
      end

      def format_property(line)
        "#{CARTOCSS_PROPERTY_INDENTATION}#{line}"
      end
    end
  end
end
