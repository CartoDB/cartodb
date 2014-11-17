# encoding: utf-8

module CartoDB
  module Importer2
    class TableSampler

      attr_reader :db, :qualified_table_name, :ids_column, :sample_size

      def initialize db, qualified_table_name, ids_column, sample_size
        @db = db
        @qualified_table_name = qualified_table_name
        @ids_column = ids_column
        @sample_size = sample_size
      end

      def sample
        db[%Q(
          SELECT * FROM #{qualified_table_name}
          #{sample_where_clause}
        )].all
      end

      def sample_where_clause
        if ids_count <= sample_size
          ""
        else
          "WHERE #{ids_column} IN (#{sample_indices.to_a.join(',')})"
        end
      end

      def sample_indices
        if ids_count / 2 > sample_size
          sample_indices_add_method
        else
          sample_indices_delete_method
        end
      end

      def sample_indices_add_method
        sample_indices = Set.new
        while sample_indices.size < sample_size
          random_index = rand(min_id..max_id)
          sample_indices.add(random_index)
        end
        sample_indices
      end

      def sample_indices_delete_method
        sample_indices = Set.new(min_id..max_id)
        while sample_indices.size > sample_size
          random_index = rand(min_id..max_id)
          sample_indices.delete random_index
        end
        sample_indices
      end

      def ids_count
        @ids_count ||= max_id - min_id + 1
      end

      def min_id
        @min_id ||= id_min_max[:min_id]
      end

      def max_id
        @max_id ||= id_min_max[:max_id]
      end

      def id_min_max
        @id_min_max ||= db[%Q(
          SELECT min(#{ids_column}) AS min_id, max(#{ids_column}) AS max_id
          FROM #{qualified_table_name}
        )].first
      end

    end
  end
end
