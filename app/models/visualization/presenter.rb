# encoding: utf-8

module CartoDB
  module Visualization
    class Presenter
      def initialize(visualization)
        @visualization = visualization
      end #initialize

      def to_poro
        {
          id:               visualization.id,
          name:             visualization.name,
          map_id:           visualization.map_id,
          active_layer_id:  visualization.active_layer_id,
          type:             visualization.type,
          tags:             visualization.tags,
          description:      visualization.description,
          privacy:          visualization.privacy.upcase,
          table:            table_data_for(visualization.table),
          related_tables:   related_tables,
          stats:            visualization.stats,
          created_at:       visualization.created_at,
          updated_at:       visualization.updated_at
        }
      end #to_poro

      private

      attr_reader :visualization

      def table_data_for(table=nil)
        return {} unless table
        {
          id:               table.id,
          name:             table.name,
          privacy:          table.privacy_text,
          size:             table.table_size,
          row_count:        table.rows_estimated,
          updated_at:       table.updated_at
        }
      end #table_data_for

      def related_tables
        without_associated_table(visualization.related_tables)
          .map { |table| table_data_for(table) }
      end #related_tables

      def without_associated_table(tables)
        return tables unless visualization.table
        tables.select { |table| table.id != visualization.table.id }
      end #without_associated_table
    end # Presenter
  end # Visualization
end # CartoDB

