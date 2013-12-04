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
        return self unless runner.remote_data_updated?

        result = results.select(&:success?).first

        cartodbfy(result)
        grant_access_to(CartoDB::TILE_DB_USER, result)
        overwrite(table_name, result)

        table = ::Table.where(name: table_name, user_id: user.id).first
        table.send :update_table_pg_stats
        table.send :set_trigger_cache_timestamp
        table.send :invalidate_varnish_cache
        #table.send :set_trigger_check_quota
        #table.send :set_trigger_update_updated_at
        self
      rescue => exception
        puts exception.to_s + exception.backtrace.join
        raise
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

      def cartodbfy(result)
        database.run(%Q(SELECT CDB_CartodbfyTable('#{oid_from(result)}')))
      rescue => exception
        stacktrace = exception.to_s + exception.backtrace.join("\n")
        Rollbar.report_message("Sync cartodbfy error", "error", error_info: stacktrace)
        raise
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

      def oid_from(result)
        database[%Q(
          SELECT '#{result.schema}.#{result.table_name}'::regclass::oid
          AS oid
        )].first.fetch(:oid)
      end

      def grant_access_to(db_user, result)
        user.in_database(:as => :superuser).run(%Q{
          GRANT SELECT ON "#{result.schema}"."#{result.table_name}"
          TO #{db_user}
        })
      end

      private

      attr_reader :table_name, :runner, :database, :user
    end # Synchronization
  end # Connector
end # CartoDB

