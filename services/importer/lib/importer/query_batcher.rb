# encoding: UTF-8
module CartoDB
  module Importer2

    # WARNING1: Doesn't work with CTEs, only pure UPDATEs.
    # WARNING2: Do not use an alias for the target table. E.g:
    #   use 'UPDATE table_name SET ...'
    #   instead of 'UPDATE table_name AS alias SET ...'
    class QueryBatcher
      DEFAULT_BATCH_SIZE = 20000
      # If present, will concat there the additional where condition required for batching
      QUERY_WHERE_PLACEHOLDER = '/* BATCHER_WHERE */'
      QUERY_LIMIT_SUBQUERY_PLACEHOLDER = '/* BATCHER_SUBQUERY */'

      def initialize(db, logger = nil, capture_exceptions = false, batch_size = DEFAULT_BATCH_SIZE)
        @db = db
        @logger = logger
        @capture_exceptions = capture_exceptions
        @batch_size = batch_size
      end

      # Executes update query of the form UPDATE table_name SET set_clause WHERE where_condition, by batches
      # first_fragment: sql part before 'where' keyword. Example: 'update mytable set mycolumn = 1'
      # condition_fragment: sql part after 'where' keyword (you must not include where keyword). Example: 'mycolumn = 555 and mycolumn2 != 3'
      def execute_update(first_fragment, table_name,  condition_fragment = nil, message = nil)
        message ||= "Batching #{first_fragment}, #{condition_fragment}"
        temp_column = "cartodb_processed_#{table_name.hash.abs}"
        batched_query = batched_query(first_fragment, table_name, temp_column, message, condition_fragment)
        QueryBatcher.process(@db, batched_query, @logger, @capture_exceptions, table_name, temp_column, message)
      end

      # INFO: this method has the same purpose than `QueryBatcher.execute`, but it does it in a different way.
      # Issue #1994 revealed previous method had a problem: if a batch does not match query condition processing
      # stops. This method fixes this by setting the condition in the windowing fragment of the query instead of
      # the main body of the query. It's not been fixed in the previous method because the use of placeholders
      # made the fix really hard, risky (for backwards compatibility) and almost impossible to read. Receiving
      # both parts separatelly makes things much easier.
      def batched_query(first_fragment, table_name, temp_column, message, condition_fragment = nil)
        condition_fragment = condition_fragment.nil? ? '' : %Q{and #{condition_fragment}}

        limit_subquery_fragment = %Q{
          where #{table_name}.CTID IN (
            SELECT CTID FROM #{table_name} WHERE #{temp_column} IS NULL #{condition_fragment} LIMIT #{@batch_size}
          )
        }

        first_fragment + %Q{, #{temp_column} = TRUE } + limit_subquery_fragment
      end

      # @param db_object mixed
      # @param query string
      # @param table_name string
      # @param logger mixed|nil If nill, will use internal console-based logger
      # @param log_message string
      # @param capture_exceptions bool
      # @param batch_size int
      def self.execute(db_object, query, table_name, logger, log_message, capture_exceptions=false,
                       batch_size=DEFAULT_BATCH_SIZE)
        batched_query = query

        temp_column = "cartodb_processed_#{table_name.hash.abs}"

        where_fragment = %Q{
          , #{temp_column} = TRUE
        }
        limit_subquery_fragment = %Q{
           #{table_name}.CTID IN (
            SELECT CTID FROM #{table_name} WHERE #{temp_column} IS NULL LIMIT #{batch_size}
          )
        }

        if batched_query.include? QUERY_WHERE_PLACEHOLDER
          batched_query.sub! QUERY_WHERE_PLACEHOLDER, where_fragment
        else
          batched_query << where_fragment
        end

        if batched_query.include? QUERY_LIMIT_SUBQUERY_PLACEHOLDER
          batched_query.sub! QUERY_LIMIT_SUBQUERY_PLACEHOLDER, ' AND ' + limit_subquery_fragment
        else
          batched_query << ' WHERE ' + limit_subquery_fragment
        end

        process(db_object, batched_query, logger, capture_exceptions, table_name, temp_column, log_message)
      end

      def self.process(db_object, batched_query, logger, capture_exceptions, table_name, temp_column, log_message)
        log = logger.nil? ? ConsoleLog.new : logger
        log.log log_message

        begin
          add_processed_column(db_object, table_name, temp_column)
          process_batched_query(db_object, batched_query, log, capture_exceptions)
          remove_processed_column(db_object, table_name, temp_column)

          log.log "FINISHED: #{log_message}"
        rescue => exception
          raise exception unless capture_exceptions
          log.log "ERROR. QUERY:\n#{batched_query}\n---------------------------"
          log.log "#{exception.to_s}\n---------------------------"
          log.log "#{exception.backtrace}\n---------------------------"
        end
      end

      def self.process_batched_query(db_object, batched_query, log, capture_exceptions)
        total_rows_processed = 0
        affected_rows_count = 0
        begin
          begin
            affected_rows_count = db_object.execute(batched_query)
            total_rows_processed = total_rows_processed + affected_rows_count
            log.log "Total processed: #{total_rows_processed}"
          rescue => exception
            raise exception unless capture_exceptions
            log.log "#{exception.to_s}\n---------------------------"
            log.log "Total processed:#{total_rows_processed}\nQUERY:\n#{batched_query}\n---------------------------"
            log.log "#{exception.backtrace}\n---------------------------"
            affected_rows_count = -1
          end
        end while affected_rows_count > 0
      end

      def self.add_processed_column(db, table_name, column_name)
        db.run(%Q{ALTER TABLE #{table_name} ADD #{column_name} BOOLEAN;})
        db.run(%Q{CREATE INDEX idx_#{column_name} ON #{table_name} (#{column_name});})
      end

      def self.remove_processed_column(db_object, table_name, column_name)
        db_object.run(%Q{
         ALTER TABLE #{table_name} DROP #{column_name};
        })
      end

    end

    class ConsoleLog
      def log(message)
        puts message
      end
    end

  end
end
