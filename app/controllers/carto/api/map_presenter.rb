module Carto
  module Api
    class MapPresenter
      def initialize(map)
        @map = map
      end

      def to_hash
        {
          bounding_box_ne: @map.bounding_box_ne,
          bounding_box_sw: @map.bounding_box_sw,
          center: @map.center,
          options: @map.options,
          id: @map.id,
          provider: @map.provider,
          user_id: @map.user_id,
          view_bounds_ne: @map.view_bounds_ne,
          view_bounds_sw: @map.view_bounds_sw,
          zoom: @map.zoom,
          legends: @map.legends,
          scrollwheel: @map.scrollwheel
        }
      end
    end
  end
end
