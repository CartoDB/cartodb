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
        move_to_schema(result)

        database.transaction do
          rename(table_name, temporary_name) if exists?(table_name)
          rename(result.table_name, table_name)
          drop(temporary_name) if exists?(temporary_name)
        end
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
        Rollbar.report_message("Sync cartodbfy error", "error", error_info: stacktrace)
        table.send(:invalidate_varnish_cache)
      end

      def update_cdb_tablemetadata(name)
        user.in_database(as: :superuser)[:cdb_tablemetadata]
          .where(tabname: name)
          .update(updated_at: Time.now)
      rescue => exception
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

      attr_reader :table_name, :runner, :database, :user
    end # Synchronization
  end # Connector
end # CartoDB

