module Carto
  module Importer
    class TableSetup

      include ::LoggerHelper

      STATEMENT_TIMEOUT = 1.hour * 1000

      def initialize(user:, overviews_creator:, log:, statement_timeout: STATEMENT_TIMEOUT)
        @user = user
        @overviews_creator = overviews_creator
        @log = log
        @statement_timeout = statement_timeout
      end

      # Store all properties from the table to re-create them after "syncing" the table by reimporting and swapping it
      def generate_table_statements(origin_schema, origin_table_name)
        @user.in_database(as: :superuser)[%(
            SELECT quote_literal(q) as q FROM unnest(cartodb.CDB_GetTableQueries(
                            concat(quote_ident('#{origin_schema}'), '.',
                                   quote_ident('#{origin_table_name}'))::regclass::oid,
                            ignore_cartodbfication := true)) as q
          )].map { |record| record.fetch(:q) }
      end

      def run_table_statements(statements, database)
        # This should be passing the array from CDB_GetTableQueries as is, but I couldn't find a way
        # to do it with sequel, so I'm calling CDB_ApplyQueriesSafe multiple times with arrays of length 1
        # after saving the original array to a ruby array and the strings with quote_literal
        # Gotta love ORMs
        statements.each do |statement|
          begin
            arr_statement = %(SELECT cartodb.CDB_ApplyQueriesSafe(ARRAY[#{statement}]))
            database.run(arr_statement)
          rescue StandardError => e
            log_error(exception: e)
          end
        end
      end

      def cartodbfy(table_name)
        schema_name = @user.database_schema
        qualified_table_name = "\"#{schema_name}\".#{table_name}"

        @user.transaction_with_timeout(statement_timeout: @statement_timeout) do |user_conn|
          user_conn.run(%{
            SELECT cartodb.CDB_CartodbfyTable('#{schema_name}'::TEXT,'#{qualified_table_name}'::REGCLASS);
          })
        end

        update_table_pg_stats(qualified_table_name)
      rescue StandardError => e
        log_error(message: 'Error in sync cartodbfy', exception: e, table: { name: table_name })
        raise e
      end

      def fix_oid(table_name)
        user_table = Carto::UserTable.find(@user.tables.where(name: table_name).first.id)

        user_table.sync_table_id
        user_table.save
      end

      def update_table_pg_stats(qualified_table_name)
        @user.transaction_with_timeout(statement_timeout: @statement_timeout) do |user_conn|
          user_conn.run(%{
            ANALYZE #{qualified_table_name};
          })
        end
      end

      def update_cdb_tablemetadata(name)
        @user.tables.where(name: name).first.update_cdb_tablemetadata
      end

      def sanitize_columns(name)
        @user.tables.where(name: name).first.service.sanitize_columns(
          database_schema: @user.database_schema,
          connection: @user.in_database
        )
      end

      private

      def log_context
        super.merge(current_user: @user)
      end
    end
  end
end
