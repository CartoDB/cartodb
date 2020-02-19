module Carto
  module Api
    class OverlayPresenter

      PUBLIC_VALUES =  [:id, :order, :type, :template, :options, :visualization_id].freeze
      VIZJSON_VALUES = [:type, :order, :options, :template].freeze

      def initialize(overlay)
        @overlay = overlay
      end

      def to_poro
        values(@overlay, PUBLIC_VALUES)
      end

      def to_vizjson_poro
        values(@overlay, VIZJSON_VALUES)
      end

      alias_method :to_vizjson, :to_vizjson_poro

      protected

      def values(overlay, attribute_list)
        Hash[attribute_list.map { |attribute| [attribute, overlay.send(attribute)] }]
      end

    end
  end
end
