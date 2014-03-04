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
      end

      def run(&tracker)
        runner.run(&tracker)
        result = runner.results.select(&:success?).first

        if runner.remote_data_updated?
          raise ("Expecting success data for table '#{table_name}'.Results:" + runner.results.to_s) if result.nil?
          copy_privileges("public.#{table_name}", result.qualified_table_name)
          copy_indexes("public.#{table_name}", result.qualified_table_name)
          overwrite(table_name, result)
          cartodbfy(table_name)
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
        move_to_schema(result)

        database.transaction do
          rename(table_name, temporary_name) if exists?(table_name)
          rename(result.table_name, table_name)
          drop(temporary_name) if exists?(temporary_name)
        end
      rescue
        drop(result.table_name) if exists?(result.table_name)
      end

      def cartodbfy(table_name)
        table = ::Table.where(name: table_name, user_id: user.id).first
        #table.migrate_existing_table = table_name
        table.force_schema = true
        table.send :update_updated_at
        table.import_to_cartodb(table_name)
        table.schema(reload: true)
        table.import_cleanup
        table.schema(reload: true)
        table.reload
        # Set default triggers
        table.send :set_the_geom_column!
        table.send :update_table_pg_stats
        table.send :set_trigger_update_updated_at
        table.send :set_trigger_check_quota
        table.send :set_trigger_track_updates
        table.save
        table.send(:invalidate_varnish_cache)
        update_cdb_tablemetadata(table.name)
        database.run("UPDATE #{table_name} SET updated_at = NOW() WHERE cartodb_id IN (SELECT MAX(cartodb_id) from #{table_name})")
      rescue => exception
        stacktrace = exception.to_s + exception.backtrace.join
        puts stacktrace
        Rollbar.report_message('Sync cartodbfy error', 'error', error_info: stacktrace)
        table.send(:invalidate_varnish_cache)
      end

      def update_cdb_tablemetadata(name)
        user.in_database(as: :superuser).run(%Q{
          INSERT INTO cdb_tablemetadata (tabname, updated_at)
          VALUES ('#{name}'::regclass::oid, NOW())
        })
      rescue Sequel::DatabaseError
        user.in_database(as: :superuser).run(%Q{
           UPDATE cdb_tablemetadata
           SET updated_at = NOW()
           WHERE tabname = '#{name}'::regclass
        })
      end

      def success?
        (!@failed  && runner.success?)
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
          SET SCHEMA public
        })
      end

      def rename(current_name, new_name)
        database.execute(%Q{
          ALTER TABLE "public"."#{current_name}"
          RENAME TO "#{new_name}"
        })
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE #{table_name}))
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
      end #errors_from

      def runner_log_trace
        runner.results.map(&:log_trace).compact.first
      end #runner_log_trace

      def error_message
        ''
      end

      def temporary_name_for(table_name)
        "#{table_name}_to_be_deleted"
      end

      def copy_privileges(origin_table_name, destination_table_name)
        user.in_database(as: :superuser).execute(%Q(
          UPDATE pg_class
          SET relacl=(
            SELECT relacl FROM pg_class
            WHERE relname='#{origin_table_name}'
          )
          WHERE relname='#{destination_table_name}'
        ))
      end

      def copy_indexes(origin_table_name, destination_table_name)
        origin_schema, origin_table_name = origin_table_name.split('.')
        user.in_database(as: :superuser)[%Q(
          SELECT indexdef AS indexdef
          FROM pg_indexes
          WHERE schemaname = '#{origin_schema}'
          AND tablename = '#{origin_table_name}'
        )].each do |record|
          puts record.inspect
          begin
              statement = record.fetch(:indexdef).gsub(
                /ON #{origin_table_name}/,
                "ON #{destination_table_name}"
              )
              puts statement.inspect
            database.run(statement)
          rescue => exception
            puts exception.to_s + exception.backtrace.join("\n")
          end
        end
      end

      private

      attr_reader :table_name, :runner, :database, :user
    end # Synchronization
  end # Connector
end # CartoDB

