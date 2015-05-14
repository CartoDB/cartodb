# encoding: UTF-8

module Carto
  module Api
    class OverlayPresenter

      PUBLIC_VALUES = [:id, :order, :type, :template, :options, :visualization_id]

      def initialize(overlay)
        @overlay = overlay
      end

      def to_poro
         public_values(@overlay)
      end

      protected

      def public_values(overlay)
        Hash[ PUBLIC_VALUES.map { |attribute| [attribute, overlay.send(attribute)] } ]
      end

    end
  end
end