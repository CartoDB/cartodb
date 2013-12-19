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
        @table        = ::Table.find_by_identifier(user.id, table_name)
      end

      def run(&tracker)
        runner.run(&tracker)
        result = results.select(&:success?).first
        if runner.remote_data_updated?
          overwrite(table_name, result)
          cartodbfy(table_name)
        end
        self
      rescue => exception
        puts exception.to_s
        puts exception.backtrace
      end

      def overwrite(table_name, result)
        return false unless runner.remote_data_updated?

        temporary_name = temporary_name_for(result.table_name)

        database.transaction do
          move_to_schema(result)
          rename(table_name, temporary_name) if exists?(table_name)
          rename(result.table_name, table_name)
          drop(temporary_name) if exists?(temporary_name)
        end
      rescue => exception
        drop(result.table_name) if exists?(result.table_name)
      end

      def cartodbfy(table_name)
        table.table_id = oid_from(table_name)
        table.migrate_existing_table = table_name
        table.save
        table.force_schema = true
        table.send :update_updated_at
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
        update_cdb_tablemetadata(table_name)
        database.run("UPDATE #{table_name} SET updated_at = NOW() WHERE cartodb_id IN (SELECT MAX(cartodb_id) from #{table_name})")
      rescue => exception
        stacktrace = exception.to_s + exception.backtrace.join
        puts stacktrace
        Rollbar.report_message("Sync cartodbfy error", "error", error_info: stacktrace)
        table.send(:invalidate_varnish_cache)
      end

      def update_cdb_tablemetadata(table_id)
        user.in_database(as: :superuser).run(%Q{
          INSERT INTO cdb_tablemetadata (tabname, updated_at)
          VALUES ('#{table_id}', NOW())
        })
      rescue Sequel::DatabaseError => exception
        user.in_database(as: :superuser).run(%Q{
          UPDATE cdb_tablemetadata
          SET updated_at = NOW()
          WHERE tabname = #{table_id}
        })
      end

      def success?
        runner.success?
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

      def oid_from(table_name)
        database[%Q(
          SELECT '#{DESTINATION_SCHEMA}.#{table_name}'::regclass::oid
          AS oid
        )].first.fetch(:oid)
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
        results.map(&:error_code).compact.first
      end #errors_from

      def error_message
        ''
      end

      def temporary_name_for(table_name)
        "#{table_name}_to_be_deleted"
      end

      private

      attr_reader :table_name, :runner, :database, :user, :table
    end # Synchronization
  end # Connector
end # CartoDB

