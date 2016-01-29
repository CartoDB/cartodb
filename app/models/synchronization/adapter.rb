# encoding: utf-8

module CartoDB
  module Synchronization
    class Adapter
      DESTINATION_SCHEMA = 'public'

      attr_accessor :table

      def initialize(table_name, runner, database, user)
        @table_name   = table_name
        @runner       = runner
        @database     = database
        @user         = user
        @failed       = false
        @broken       = false
      end

      def run(&tracker)
        runner.run(&tracker)
        result = runner.results.select(&:success?).first

        if runner.remote_data_updated?
          if result.nil?
            data_for_exception = "Expecting success data for table '#{table_name}'\nResults:#{runner.results.to_s}\n"
            data_for_exception << "1st result:#{runner.results.first.inspect}"
            raise data_for_exception
          end
          # Store columns types before overwriting
          old_columns = get_columns(table_name)

          copy_privileges(user.database_schema, table_name, result.schema, result.table_name)
          index_statements = generate_index_statements(user.database_schema, table_name)
          overwrite(table_name, result)
          cartodbfy(table_name)
          run_index_statements(index_statements)

          # Chech if the schema has changed
          new_columns = get_columns(table_name)
          check_schema_changed(old_columns, new_columns)
        end
        self
      rescue => exception
        @failed = true
        puts '=================='
        puts exception.to_s
        puts exception.backtrace
        puts '=================='
      end

      def overwrite(table_name, result)
        return false unless runner.remote_data_updated?

        temporary_name = temporary_name_for(result.table_name)

        # The relation might (and probably will) already exist in the user public schema
        # as source table is a synchronization and those keep same ID along their life
        # (and the geom index uses table id as base for its name),
        # so first we need to remove old table, then change schema of the imported one
        # and finally rename newly moved table to original name
        database.transaction do
          rename(table_name, temporary_name) if exists?(table_name)
          drop(temporary_name) if exists?(temporary_name)
          move_to_schema(result)
          rename(result.table_name, table_name)
        end
        fix_oid(table_name)
      rescue => exception
        puts "Sync overwrite ERROR: #{exception.message}: #{exception.backtrace.join}"
        CartoDB.notify_error('Error in sync cartodbfy',
                             error: exception.backtrace.join('\n'), user_id: user.id,
                             table: table_name, result: result)
        drop(result.table_name) if exists?(result.table_name)
      end

      def fix_oid(table_name)
        actual_oid_from_user_database = database.fetch(%Q{SELECT '#{table_name}'::regclass::oid}).first[:oid]
        table = ::Table.new(:user_table => ::UserTable.where(name: table_name, user_id: user.id).first)
        table.table_id = actual_oid_from_user_database.to_i
        table.save
      end

      def cartodbfy(table_name)
        table = ::Table.new(:user_table => ::UserTable.where(name: table_name, user_id: user.id).first)
        table.force_schema = true
        table.import_to_cartodb(table_name)
        table.schema(reload: true)
        table.send :set_the_geom_column!
        table.import_cleanup
        table.send :cartodbfy
        table.schema(reload: true)
        table.reload
        table.send :update_table_pg_stats
        table.save
        table.send(:invalidate_varnish_cache)
        update_cdb_tablemetadata(table.name)
      rescue => exception
        puts "Sync cartodbfy ERROR: #{exception.message}: #{exception.backtrace.join}"
        CartoDB.notify_error('Error in sync cartodbfy',
                             error: exception.backtrace.join('\n'), user_id: user.id, table: table_name)
        table.send(:invalidate_varnish_cache)
      end

      def update_cdb_tablemetadata(name)
        qualified_name = "\"#{user.database_schema}\".\"#{name}\""
        user.in_database(as: :superuser).run(%Q{
          SELECT CDB_TableMetadataTouch('#{qualified_name}')
        })
      end

      def success?
        (!@failed  && runner.success?)
      end

      def schema_broken?
        @broken
      end

      def etag
        runner.etag
      end

      def last_modified
        runner.last_modified
      end

      def checksum
        runner.checksum
      end

      def move_to_schema(result, schema=DESTINATION_SCHEMA)
        return self if schema == result.schema
        database.execute(%Q{
          ALTER TABLE "#{result.schema}"."#{result.table_name}"
          SET SCHEMA "#{user.database_schema}"
        })
      end

      def rename(current_name, new_name)
        database.execute(%Q{
          ALTER TABLE "#{user.database_schema}"."#{current_name}"
          RENAME TO #{new_name}
        })
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE "#{user.database_schema}"."#{table_name}"))
      rescue
        self
      end

      def exists?(table_name)
        database.table_exists?(table_name)
      end

      def results
        runner.results
      end

      def error_code
        runner.results.map(&:error_code).compact.first
      end

      def runner_log_trace
        runner.results.map(&:log_trace).compact.first
      end

      def error_message
        ''
      end

      def temporary_name_for(table_name)
        "#{table_name}_to_be_deleted"
      end

      def copy_privileges(origin_schema, origin_table_name, destination_schema, destination_table_name)
        user.in_database(as: :superuser).execute(%Q(
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
        Rollbar.report_message('Error copying privileges', 'error',
                               { error: exception.inspect,
                                 origin_schema: origin_schema,
                                 origin_table_name: origin_table_name,
                                 destination_schema: destination_schema,
                                 destination_table_name: destination_table_name } )
      end

      # Store all indexes to re-create them after "syncing" the table by reimporting and swapping it
      # INFO: As upon import geom index names are not enforced, they might "not collide" and generate one on the new import
      # plus the one already existing, so we skip those
      def generate_index_statements(origin_schema, origin_table_name)
        # INFO: This code discerns gist indexes like lib/sql/CDB_CartodbfyTable.sql -> _CDB_create_the_geom_columns
        user.in_database(as: :superuser)[%Q(
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

      def run_index_statements(statements)
        statements.each { |statement|
          begin
            database.run(statement)
          rescue => exception
            if exception.message !~ /relation .* already exists/
              Rollbar.report_message('Error copying indexes', 'error',
                                   { error: exception.inspect,
                                     statement: statement } )
            end
          end
        }
      end

      def get_columns(table_name)
        user_table = ::UserTable.where(name: table_name, user_id: user.id).first
        ::Table.new(user_table: user_table).get_columns
      end

      def check_schema_changed(old_columns, new_columns)
        
        if old_columns.size < new_columns.size
          return
        end

        if old_columns.size > new_columns.size
          @broken = true
          return
        end

        if !old_columns.zip(new_columns).map { |x, y| x == y }.all?
          @broken = true
        end
      end

      private

      attr_reader :table_name, :runner, :database, :user
    end
  end
end

