# encoding: UTF-8

module Carto
  module Api
    class MapPresenter

      PUBLIC_VALUES = [:id, :user_id, :provider, :bounding_box_sw, :bounding_box_ne, :center, :zoom, :view_bounds_sw, 
                       :view_bounds_ne, :legends, :scrollwheel]

      def initialize(map)
        @map = map
      end

      def to_poro
         public_values(@map)
      end

      private

      def public_values(map)
        Hash[ PUBLIC_VALUES.map { |attribute| [attribute, map.send(attribute)] } ]
      end

    end
  end
end
