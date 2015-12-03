require_relative 'external_source_presenter'
require_relative 'permission_presenter'
require_relative 'user_table_presenter'

module Carto
  module Api
    class BiVisualizationPresenter

      def initialize(bi_visualization)
        @bi_visualization = bi_visualization
      end

      def to_poro
        {
          id: @bi_visualization.id,
          title: @bi_visualization.extract_value_from_viz_json('title'),
          description: @bi_visualization.extract_value_from_viz_json('description'),
          created_at: @bi_visualization.created_at,
          updated_at: @bi_visualization.updated_at,
          viz_json: @bi_visualization.viz_json
        }
      end

      def to_public_poro
        {
          id: @bi_visualization.id,
          title: @bi_visualization.extract_value_from_viz_json('title'),
          description: @bi_visualization.extract_value_from_viz_json('description'),
          updated_at: @bi_visualization.updated_at,
          viz_json: @bi_visualization.viz_json
        }
      end
    end
  end
end
