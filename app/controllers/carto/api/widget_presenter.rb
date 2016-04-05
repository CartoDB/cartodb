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
          id: @widget.id,
          type: @widget.type,
          title: @widget.title,
          order: @widget.order,
          layer_id: @widget.layer_id,
          options: @widget.options_json
        }
      end

      alias_method :to_vizjson, :to_poro

    end
  end
end
