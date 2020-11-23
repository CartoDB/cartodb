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
            SELECT unnest(q) as queries
            FROM cartodb.CDB_GetTableQueries(
                            concat(quote_ident('#{origin_schema}'), '.', quote_ident('#{origin_table_name}'))::regclass::oid,
                            ignore_cartodbfication := true) q
          )].map { |record| record.fetch(:queries) }
      end

      def run_table_statements(statements, database)
        statements.each do |statement|
          begin
            database.run(statement)
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

      def recreate_overviews(table_name)
        dataset = @overviews_creator.dataset(table_name)
        dataset.update_overviews!
      rescue StandardError => e
        # In case of overview creation failure we'll just omit the
        # overviews creation and continue with the process.
        # Since the actual creation is handled by a single SQL
        # function, and thus executed in a transaction, we shouldn't
        # need any clean up here. (Either all overviews were created
        # or nothing changed)
        @log.append("Overviews recreation failed: #{e.message}")
        log_error(message: 'Error creating overviews', exception: e, table_name: table_name)
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

      private

      def log_context
        super.merge(current_user: @user)
      end
    end
  end
end
