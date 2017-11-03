module Carto
  class UserTableIndexService
    AUTO_INDEX_TTL_MS = 600000
    AUTO_INDEX_PREFIX = '_auto_idx_'.freeze
    INDEXABLE_WIDGET_TYPES = %w(histogram category time-series).freeze

    # Not worth it to create indices on small tables, where a full scan is cheap.
    # Maybe better to use number of pages instead of rows instead.
    MINIMUM_ROW_COUNT_TO_INDEX = 10000
    # Number of categories (most common) shown by default in widgets, used to determine the number
    # of categories likely to be used for filtering.
    CATEGORIES_SHOWN_IN_WIDGET = 5
    # Number of different values in a column to consider indexing it, to avoid indexing boolean columns.
    # Note: Also used to index columns with less values but an unbalanced probability distribution.
    MINIMUM_COLUMN_VALUES_TO_INDEX = 5
    # Regardless of anything, columns with high clustering factor (sorted in physical order) are also indexed.
    MINIMUM_CORRELATION_TO_INDEX = 0.9

    def initialize(user_table)
      @user_table = user_table
      @table = user_table.service
    end

    def update_auto_indices
      bolt = Carto::Bolt.new("user_table:#{@user_table.id}:auto_index", ttl_ms: AUTO_INDEX_TTL_MS)

      bolt.run_locked { generate_indices }
    end

    private

    def generate_indices
      auto_indices(valid: false).each do |idx|
        CartoDB::Logger.debug(message: 'Auto index', action: 'drop invalid', table: @user_table, column: idx[:column])
        @table.drop_index(idx[:column], AUTO_INDEX_PREFIX, concurrent: true)
      end

      widget_columns = (@table.estimated_row_count > MINIMUM_ROW_COUNT_TO_INDEX) ? columns_with_widgets : []
      columns_to_index = widget_columns.select { |c| indexable_column?(c) }

      indexed_columns = valid_indices.map { |i| i[:column] }
      create_index_on = columns_to_index - indexed_columns
      create_index_on.each do |col|
        CartoDB::Logger.debug(message: 'Auto index', action: 'create', table: @user_table, column: col)
        @table.create_index(col, AUTO_INDEX_PREFIX, concurrent: true)
      end

      auto_indexed_columns = auto_indices.map { |i| i[:column] }
      drop_index_on = auto_indexed_columns - columns_to_index
      drop_index_on.each do |col|
        @table.drop_index(col, AUTO_INDEX_PREFIX, concurrent: true)
      end
    rescue => e
      CartoDB::Logger.error(exception: e, message: 'Error auto-indexing table', table: @user_table)
    end

    def indexable_column?(column)
      stats = pg_stats_by_column[column]
      return false unless stats

      # Accept columns with several different values
      # Checks common values and accepts cases with several value
      # or with few but unbalanced values (e.g: boolean with 80/20 distribution)
      common_freqs = stats[:most_common_freqs] || stats[:most_common_elem_freqs]
      if common_freqs.present?
        check_common_freq = common_freqs[CATEGORIES_SHOWN_IN_WIDGET - 1] || common_freqs.last
        if check_common_freq < (1.0 / MINIMUM_COLUMN_VALUES_TO_INDEX)
          return true
        end
      else
        # No histogram, rely on distinct values. Note: Values < 0 represent a proportion over the number of rows.
        # They are generated when the analyzer gives up counting or identifies the value as a continuous magnitude
        distinct = stats[:n_distinct]
        return true if distinct < 0 || distinct > MINIMUM_COLUMN_VALUES_TO_INDEX
      end

      # Accept columns with high correlation (values related to physical row order)
      if stats[:correlation].abs > MINIMUM_CORRELATION_TO_INDEX
        return true
      end

      # Default
      false
    end

    def auto_indices(valid: true)
      indices.select { |i| i[:name].starts_with?(AUTO_INDEX_PREFIX) && i[:valid] == valid }
    end

    def valid_indices
      indices.select { |i| i[:valid] }
    end

    def indices
      @indices ||= @table.pg_indexes
    end

    def columns_with_widgets
      columns = Set.new
      table_widgets.select { |w| INDEXABLE_WIDGET_TYPES.include?(w.type) }.each do |w|
        columns.add(w.column)
      end
      columns
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

    def pg_stats_by_column
      @stats ||= get_pg_stats_by_column
    end

    def get_pg_stats_by_column
      @table.update_table_pg_stats
      stats = @table.pg_stats
      if stats && !stats.empty?
        stats.map { |s| { s[:attname] => s } }.reduce(:merge)
      else
        CartoDB::Logger.warning(message: 'Error retrieving stats for table', table: @user_table)
        {}
      end
    end
  end
end
