# encoding: utf-8

module CartoDB
  module Synchronization
    class Adapter
      DEFAULT_SCHEMA = 'cdb_importer'

      attr_accessor :table

      def initialize(table_name, runner, database)
        @table_name       = table_name
        @runner           = runner
        @database         = database
      end

      def run(&tracker)
        runner.run(&tracker)
        result = results.select(&:success?).first
        overwrite(table_name, result)
        self
      end

      def overwrite(table_name, result)
        return false unless runner.remote_data_updated?

        move_to_schema(result)

        database.transaction do
          rename(table_name, 'to_be_deleted') if exists?(table_name)
          rename(result.table_name, table_name)
          drop('to_be_deleted') if exists?(table_name)
        end
      end

      def success?
        runner.success?
      end

      def move_to_schema(result, schema=DEFAULT_SCHEMA)
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
        persist_metadata(new_name)
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE #{table_name}))
      rescue
        self
      end

      def exists?(table_name)
      end

      def results
        runner.results
      end 

      def error_code
        return 8002 if table_quota_exceeded?
        results.map(&:error_code).compact.first
      end #errors_from

      private

      attr_reader :table_name, :runner, :database
    end # Synchronization
  end # Connector
end # CartoDB

