# encoding utf-8

require_dependency 'cartocss/cartography'
require_dependency 'cartocss/style'

module Carto
  module CartoCSS
    class Default
      GEOMETRY_TYPE_POINT = 'point'.freeze
      GEOMETRY_TYPE_LINE = 'line'.freeze
      GEOMETRY_TYPE_POLYGON = 'polygon'.freeze

      def initialize(geometry_type)
        @geometry_type = geometry_type
      end

      def cartocss
        Carto::CartoCSS:Style.new(definition).to_cartocss
      end

      private

      def definition
        @definition ||= cartography[@geometry_type]
      end

      def cartography
        @cartography ||= Carto::CartoCSS::Cartography.new
      end
    end
  end
end
