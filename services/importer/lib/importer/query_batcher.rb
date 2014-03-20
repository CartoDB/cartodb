
module CartoDB
  module Importer2
    class QueryBatcher
      DEFAULT_BATCH_SIZE = 25000
      # If present, will concat there the additional where condition required for batching
      QUERY_WHERE_PLACEHOLDER = '/* BATCHER_WHERE */'
      QUERY_LIMIT_SUBQUERY_PLACEHOLDER = '/* BATCHER_SUBQUERY */'

      def self.execute(db_object, query, table_name, logger, log_message, capture_exceptions=false, batch_size=DEFAULT_BATCH_SIZE)
        logger.log log_message

        batched_query = query

        total_rows_processed = 0
        affected_rows_count = 0
        id_column = 'ogc_fid' # Only PostGIS driver (but can be changed, @see http://www.gdal.org/ogr/drv_pg.html)
        temp_column = "cartodb_processed_#{table_name.hash.abs}"

        where_fragment = %Q{
          , #{temp_column} = TRUE
        }
        limit_subquery_fragment = %Q{
           #{id_column} IN (
            SELECT #{id_column} FROM #{table_name} WHERE #{temp_column} != TRUE LIMIT #{batch_size}
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

        add_processed_column(db_object, table_name, temp_column)

        begin
          begin
            affected_rows_count = db_object.execute(batched_query)
            total_rows_processed = total_rows_processed + affected_rows_count
            logger.log "Total processed: #{total_rows_processed}"
          rescue => exception
            raise exception unless capture_exceptions
            logger.log "#{exception.to_s}\n---------------------------"
            logger.log "Total processed:#{total_rows_processed}\nQUERY:\n#{batched_query}\n---------------------------"
            logger.log "#{exception.backtrace}\n---------------------------"
            affected_rows_count = -1
          end
        end while affected_rows_count > 0

        remove_processed_column(db_object, table_name, temp_column)

        logger.log "FINISHED: #{log_message}"
      end #self.execute

      def self.add_processed_column(db_object, table_name, column_name)
        db_object.run(%Q{
         ALTER TABLE #{table_name} ADD #{column_name} BOOLEAN DEFAULT FALSE;
        })
        db_object.run(%Q{
          CREATE INDEX idx_#{column_name} ON #{table_name} (#{column_name})
        })
      end #self.add_processed_column

      def self.remove_processed_column(db_object, table_name, column_name)
        db_object.run(%Q{
         ALTER TABLE #{table_name} DROP #{column_name};
        })
      end # self.remove_processed_column

    end #QueryBatcher
  end #Importer2
end #CartoDB