module Carto
  module Api
    class TablePresenter
      def initialize(table, current_viewer, context)
        @table = table
        @current_viewer = current_viewer
        @context = context
      end

      def to_poro
        {
          id: @table.id,
          name: qualified_table_name,
          privacy: @table.privacy_text,
          schema: @table.schema,
          updated_at: @table.updated_at,
          rows_counted: @table.rows_estimated,
          table_size: @table.table_size,
          map_id: @table.map_id,
          description: @table.description,
          geometry_types: @table.geometry_types,
          table_visualization: VisualizationPresenter.new(@table.table_visualization, @current_viewer, @context).to_poro,
          dependent_visualizations: @table.fully_dependent_visualizations.map do |v|
            VisualizationPresenter.new(v, @current_viewer, @context).to_summarized_poro
          end,
          non_dependent_visualizations: @table.partially_dependent_visualizations.map do |v|
            VisualizationPresenter.new(v, @current_viewer, @context).to_summarized_poro
          end,
          synchronization: SynchronizationPresenter.new(@table.synchronization).to_poro
        }
      end

      private

      def qualified_table_name
        owner = @table.owner
        if @current_viewer && owner && owner.id != @current_viewer.id
          "#{owner.sql_safe_database_schema}.#{@table.name}"
        else
          @table.name
        end
      end
    end
  end
end
