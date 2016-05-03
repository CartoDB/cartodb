# encoding: utf-8

module Carto
  module Api
    class VisualizationExportPresenter

      def initialize(visualization_export)
        @visualization_export = visualization_export
      end

      def to_poro
        return {} unless @visualization_export

        {
          id: @visualization_export.id,
          visualization_id: @visualization_export.visualization_id,
          user_id: @visualization_export.user_id,
          state: @visualization_export.state,
          created_at: @visualization_export.created_at,
          updated_at: @visualization_export.updated_at
        }
      end

    end
  end
end
