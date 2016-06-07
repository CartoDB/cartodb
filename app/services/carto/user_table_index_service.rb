module Carto
  class UserTableIndexService
    AUTO_INDEX_PREFIX = '_auto_idx_'.freeze
    MINIMUM_ROW_COUNT_TO_INDEX = 10000
    INDEXABLE_WIDGET_TYPES = %w(histogram category time-series).freeze

    def initialize(user_table)
      @user_table = user_table
      @table = user_table.service
    end

    def generate_indices
      columns_to_index = (@table.estimated_row_count > MINIMUM_ROW_COUNT_TO_INDEX) ? columns_with_widgets : []
      auto_indexed_columns = auto_indices.map { |i| i[:column] }
      indexed_columns = indices.map { |i| i[:column] }

      create_index_on = columns_to_index - indexed_columns
      create_index_on.each { |col| @table.create_index(col, AUTO_INDEX_PREFIX) }

      drop_index_on = auto_indexed_columns - columns_to_index
      drop_index_on.each { |col| @table.drop_index(col, AUTO_INDEX_PREFIX) }
    end

    private

    def columns_with_widgets
      column_widgets = widgets_by_column
      column_widgets.keys
    end

    def auto_indices
      indices.select { |i| i[:name].starts_with?(AUTO_INDEX_PREFIX) }
    end

    def indices
      @indices ||= @table.pg_indexes
    end

    def widgets_by_column
      column_widgets = {}
      table_widgets.select { |w1| INDEXABLE_WIDGET_TYPES.include?(w1.type) }.each do |w2|
        column_widgets.fetch(w2.column) { |k| column_widgets[k] = [] } << w2
      end
      column_widgets
    end

    def table_widgets
      widgets.select do |w|
        node = w.analysis_node
        node && node.table_source?(@user_table.name)
      end
    end

    def widgets
      @user_table.layers.map(&:widgets).flatten
    end
  end
end
