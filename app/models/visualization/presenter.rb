# encoding: utf-8

module CartoDB
  module Visualization
    class Presenter
      def initialize(visualization)
        @visualization = visualization
      end #initialize

      def to_poro
        {
          id:           visualization.id,
          name:         visualization.name,
          map_id:       visualization.map_id,
          type:         visualization.type,
          tags:         visualization.tags,
          description:  visualization.description,
          privacy:      visualization.privacy,
          table:        table_data_for(visualization.table)
        }
      end #to_poro

      private

      attr_reader :visualization

      def table_data_for(table=nil)
        return {} unless table
        {
          id:           table.id,
          size:         table.table_size,
          row_count:    table.rows_counted,
          updated_at:   table.updated_at
        }
      end #table_data_for

    end # Presenter
  end # Visualization
end # CartoDB

