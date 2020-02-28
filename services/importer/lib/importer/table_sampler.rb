module CartoDB
  module Importer2

    # Take a sample from a database table.
    # It uses an ids_column that must have an index created on it,
    # in order to use just index scans instead of seq scans.
    class TableSampler

      attr_reader :db, :qualified_table_name, :ids_column, :sample_size

      # @param db mixed
      # @param qualified_table_name string
      # @param ids_column string
      # @param sample_size int
      def initialize db, qualified_table_name, ids_column, sample_size
        @db = db
        @qualified_table_name = qualified_table_name
        @ids_column = ids_column
        @sample_size = sample_size
      end

      # @throws TooManyColumnsProcessingError
      def sample
        db[sample_query].all
      rescue RangeError
        raise CartoDB::Importer2::TooManyColumnsProcessingError.new
      end


      private

      def sample_query
        if ids_count <= sample_size
          %Q[SELECT * FROM #{qualified_table_name}]
        else
          %Q[SELECT * FROM #{qualified_table_name} WHERE #{ids_column} IN (#{sample_indices.to_a.join(',')})]
        end
      end

      # Gets sample_size random ids  of the rows to sample
      def sample_indices
        if ids_count / 2 > sample_size
          sample_indices_add_method
        else
          sample_indices_delete_method
        end
      end

      # Add indices to the null set until we have sample_size indices
      def sample_indices_add_method
        sample_indices = Set.new
        while sample_indices.size < sample_size
          random_index = rand(min_id..max_id)
          sample_indices.add(random_index)
        end
        sample_indices
      end

      # Remove indices from the index space when sample_size is comparable to the index space
      def sample_indices_delete_method
        sample_indices = Set.new(min_id..max_id)
        while sample_indices.size > sample_size
          random_index = rand(min_id..max_id)
          sample_indices.delete random_index
        end
        sample_indices
      end

      def ids_count
        @ids_count ||=
          if max_id && min_id then
            max_id - min_id + 1
          else
            0
          end
      end

      def min_id
        @min_id ||= min_max_ids[:min]
      end

      def max_id
        @max_id ||= min_max_ids[:max]
      end

      def min_max_ids
        @min_max_ids ||= db[min_max_ids_query].first
      end

      def min_max_ids_query
        %Q(SELECT min(#{ids_column}), max(#{ids_column}) FROM #{qualified_table_name})
      end

    end
  end
end
