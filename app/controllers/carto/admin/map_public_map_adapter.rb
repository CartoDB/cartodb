module Carto
  module Admin
    class MapPublicMapAdapter
      extend Forwardable

      delegate [ :provider, :zoom ] => :map

      attr_reader :map

      def initialize(map)
        @map = map
      end

      def public_values
        {
          id: @map.id,
          user_id: @map.user_id,
          provider: @map.provider,
          bounding_box_sw: @map.bounding_box_sw,
          bounding_box_ne: @map.bounding_box_ne,
          center: @map.center,
          zoom: @map.zoom,
          view_bounds_sw: @map.view_bounds_sw,
          view_bounds_ne: @map.view_bounds_ne,
          legends: @map.legends,
          scrollwheel: @map.scrollwheel
        }
      end

    end
  end
end
