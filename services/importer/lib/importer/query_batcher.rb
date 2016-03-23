# encoding: UTF-8
require 'rollbar'

module CartoDB
  module Importer2
    class QueryBatcher

      DEFAULT_BATCH_SIZE = 20000
      DEFAULT_SEQUENCE_FIELD = 'cartodb_id'

      def initialize(db, logger = nil, create_seq_field = false, batch_size = DEFAULT_BATCH_SIZE)
        @db = db
        @batch_size = batch_size
        @logger = logger || self
        @create_seq_field = create_seq_field
      end

      def log(message)
        puts message
      end

      def execute_update(query, table_schema, table_name)
        qualified_table_name = "\"#{table_schema}\".\"#{table_name}\""
        @logger.log("Running batched query by id in #{qualified_table_name}: #{query}")

        if @create_seq_field
          column_name = "cartodb_processed_#{qualified_table_name.hash.abs}"
          prepare_id_column(column_name, qualified_table_name, table_schema)
        else
          column_name = DEFAULT_SEQUENCE_FIELD
        end

        @logger.log("Using as id '#{column_name}'")

        min, max = min_max(column_name, qualified_table_name)
        return if (min.nil? || max.nil?)

        begin
          batched_query = batched_query(query, min, min += @batch_size, column_name)
          @db[batched_query].all
        end while min <= max

        if @create_seq_field
          remove_id_column(column_name, qualified_table_name, table_schema)
        end
        
        @logger.log("Finished batched query by '#{column_name}' in #{qualified_table_name}: query")
      rescue => e
        Rollbar.report_exception(e)
        @logger.log "Error running batched query by '#{column_name}': #{query} #{e.to_s} #{e.backtrace}"
        raise e
      end

      protected

      def batched_query(query, min, max, column_name)
        contains_where = !query.match(/\swhere\s/i).nil?
        batched_query = query 
        batched_query += (contains_where ? ' AND ' : ' WHERE ')
        batched_query += " #{column_name} >= #{min} AND #{column_name} < #{max}"
        batched_query
      end

      def min_max(column_name, qualified_table_name)
        min_max = @db.fetch(%Q{
            SELECT MIN(#{column_name}), MAX(#{column_name}) FROM #{qualified_table_name}
          }).all[0]
        return [nil, nil] if min_max.nil? || min_max[:min].nil? || min_max[:max].nil?
        [ min_max[:min], min_max[:max] + 1 ]
      end

      def prepare_id_column(column_name, qualified_table_name, table_schema)
        @db.run(%Q{
            ALTER TABLE #{qualified_table_name} ADD #{column_name} INTEGER;
          })
        @db.run(%Q{
            CREATE SEQUENCE \"#{table_schema}\".seq_#{column_name};
          })
        @db.run(%Q{
            ALTER TABLE #{qualified_table_name} ALTER COLUMN #{column_name} SET DEFAULT nextval('\"#{table_schema}\".seq_#{column_name}');
          })
        @db.run(%Q{
            UPDATE #{qualified_table_name} SET #{column_name}=nextval('\"#{table_schema}\".seq_#{column_name}');
          })
        @db.run(%Q{
            CREATE INDEX idx_#{column_name} ON #{qualified_table_name} (#{column_name});
          })
      end

      def remove_id_column(column_name, qualified_table_name, table_schema)
        @db.run(%Q{
            ALTER TABLE #{qualified_table_name} DROP #{column_name};
          })

        @db.run(%Q{
            DROP SEQUENCE \"#{table_schema}\".seq_#{column_name};
          })
      end

    end

  end
end
