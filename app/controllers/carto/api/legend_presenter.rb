module Carto
  module Api
    class LegendPresenter
      def initialize(legend)
        @legend = legend
      end

      def to_hash
        {
          conf: @legend.conf,
          created_at: @legend.created_at,
          definition: @legend.definition,
          id: @legend.id,
          layer_id: @legend.layer_id,
          post_html: @legend.post_html,
          pre_html: @legend.pre_html,
          title: @legend.title,
          type: @legend.type,
          updated_at: @legend.updated_at
        }
      end
    end
  end
end
