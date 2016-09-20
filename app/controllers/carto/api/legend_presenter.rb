# encoding utf-8

module Carto
  module Api
    class LegendPresenter
      def initialize(layer)
        @layer = layer
      end

      def to_hash
        {
          created_at: @layer.created_at,
          definition: @layer.definition,
          id: @layer.id,
          layer_id: @layer.layer_id,
          post_html: @layer.post_html,
          pre_html: @layer.pre_html,
          title: @layer.title,
          type: @layer.type,
          updated_at: @layer.updated_at
        }
      end
    end
  end
end
