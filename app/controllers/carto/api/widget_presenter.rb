# encoding: utf-8

module Carto
  module Api
    class WidgetPresenter

      def initialize(widget)
        @widget = widget
      end

      def to_poro
        return {} unless @widget

        poro = {
          id: @widget.id,
          type: @widget.type,
          title: @widget.title,
          order: @widget.order,
          layer_id: @widget.layer_id,
          options: @widget.options_json
        }

        poro[:source] = { id: @widget.source_id } if @widget.source_id.present?

        poro
      end

      alias_method :to_vizjson, :to_poro

    end
  end
end
