# encoding: UTF-8
require 'rollbar'

module CartoDB
  module Importer2

    class CartodbIdQueryBatcher
      DEFAULT_BATCH_SIZE = 20000

      def initialize(db, logger = nil, batch_size = DEFAULT_BATCH_SIZE)
        @db = db
        @batch_size = batch_size
        @logger = logger || self
      end

      def log(message)
        puts message
      end

      def execute_update(query, table_schema, table_name)
        qualified_table_name = "\"#{table_schema}\".\"#{table_name}\""
        @logger.log("Running batched query by cartodb_id in #{qualified_table_name}: #{query}")

        min_max = @db.fetch(%Q{select min(cartodb_id), max(cartodb_id) from #{qualified_table_name}}).all[0]
        return if min_max.nil? || min_max[:min].nil? || min_max[:max].nil?
        min = min_max[:min]
        max = min_max[:max] + 1

        begin
          batched_query = batched_query(query, min, min += @batch_size)
          @db[batched_query].all
        end while min <= max
        
        @logger.log("Finished batched query by cartodb_id in #{qualified_table_name}: query")
      rescue => e
        Rollbar.report_exception(e)
        @logger.log "Error running batched query by cartodb_id: #{query} #{e.to_s} #{e.backtrace}"
        raise e
      end

      def batched_query(query, min, max)
        contains_where = !query.match(/\swhere\s/i).nil?
        batched_query = query 
        batched_query += (contains_where ? ' and ' : ' where ')
        batched_query += " cartodb_id >= #{min} and cartodb_id < #{max}"
        batched_query
      end

    end

  end
end
