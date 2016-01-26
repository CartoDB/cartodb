# encoding: utf-8

module Carto
  module Api
    class WidgetPresenter

      def initialize(widget)
        @widget = widget
      end

      def to_poro
        return {} unless @widget

        {
          type: @widget.type,
          title: @widget.title,
          order: @widget.order,
          layerId: @widget.layer_id,
          options: @widget.options_json
        }
      end

    end
  end
end
