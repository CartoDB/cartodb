module Carto
  module Importer
    class TableSetup
      STATEMENT_TIMEOUT = 1.hour * 1000

      def initialize(user:, overviews_creator:, log:, statement_timeout: STATEMENT_TIMEOUT)
        @user = user
        @overviews_creator = overviews_creator
        @log = log
        @statement_timeout = statement_timeout
      end

      # Store all indexes to re-create them after "syncing" the table by reimporting and swapping it
      # INFO: As upon import geom index names are not enforced, they might "not collide" and generate one on the new
      # import plus the one already existing, so we skip those
      def generate_index_statements(origin_schema, origin_table_name)
        # INFO: This code discerns gist indexes like lib/sql/CDB_CartodbfyTable.sql -> _CDB_create_the_geom_columns
        @user.in_database(as: :superuser)[%(
            SELECT indexdef AS indexdef
            FROM pg_indexes
            WHERE schemaname = '#{origin_schema}'
            AND tablename = '#{origin_table_name}'
            AND indexname NOT IN (
              SELECT ir.relname
                FROM pg_am am, pg_class ir,
                  pg_class c, pg_index i,
                  pg_attribute a
                WHERE c.oid  = '#{origin_schema}.#{origin_table_name}'::regclass::oid AND i.indrelid = c.oid
                  AND i.indexrelid = ir.oid
                  AND i.indnatts = 1
                  AND i.indkey[0] = a.attnum
                  AND a.attrelid = c.oid
                  AND NOT a.attisdropped
                  AND am.oid = ir.relam
                  AND (
                    (
                      (a.attname = '#{::Table::THE_GEOM}' OR a.attname = '#{::Table::THE_GEOM_WEBMERCATOR}')
                      AND am.amname = 'gist'
                    ) OR (
                      a.attname = '#{::Table::CARTODB_ID}'
                      AND ir.relname <> '#{origin_table_name}_pkey'
                    )
                  )
              )
          )].map { |record| record.fetch(:indexdef) }
      end

      def run_index_statements(statements, database)
        statements.each do |statement|
          begin
            database.run(statement)
          rescue => exception
            if exception.message !~ /relation .* already exists/
              CartoDB::Logger.error(exception: exception,
                                    message: 'Error copying indexes',
                                    statement: statement)
            end
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
      rescue => exception
        CartoDB::Logger.error(message: 'Error in sync cartodbfy',
                              exception: exception,
                              user: @user,
                              table: table_name)
        raise exception
      end

      def copy_privileges(origin_schema, origin_table_name, destination_schema, destination_table_name)
        @user.in_database(as: :superuser).execute(%(
          UPDATE pg_class
          SET relacl=(
            SELECT r.relacl FROM pg_class r, pg_namespace n
            WHERE r.relname='#{origin_table_name}'
            and r.relnamespace = n.oid
            and n.nspname = '#{origin_schema}'
          )
          WHERE relname='#{destination_table_name}'
          and relnamespace = (select oid from pg_namespace where nspname = '#{destination_schema}')
        ))
      rescue => exception
        CartoDB::Logger.error(exception: exception,
                              message: 'Error copying privileges',
                              origin_schema: origin_schema,
                              origin_table_name: origin_table_name,
                              destination_schema: destination_schema,
                              destination_table_name: destination_table_name)
      end

      def recreate_overviews(table_name)
        dataset = @overviews_creator.dataset(table_name)
        dataset.update_overviews!
      rescue => exception
        # In case of overview creation failure we'll just omit the
        # overviews creation and continue with the process.
        # Since the actual creation is handled by a single SQL
        # function, and thus executed in a transaction, we shouldn't
        # need any clean up here. (Either all overviews were created
        # or nothing changed)
        @log.append("Overviews recreation failed: #{exception.message}")
        CartoDB::Logger.error(
          message:    "Overviews recreation failed:  #{exception}",
          exception:  exception,
          user:       @user,
          table_name: table_name
        )
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
    end
  end
end
