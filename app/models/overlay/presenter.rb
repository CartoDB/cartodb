# encoding: utf-8

module CartoDB
  module Overlay
    class Presenter
      def initialize(overlay)
        @overlay = overlay
      end

      def to_poro
        {
          type:     overlay.type,
          order:    overlay.order,
          options:  overlay_options,
          template: overlay.template
        }
      end

      private

      attr_reader :overlay

      def overlay_options
        # After the backend refactor this will be always a hash
        overlay.options.is_a?(Hash) ? overlay.options : JSON.parse(overlay.options)
      end

    end
  end
end

