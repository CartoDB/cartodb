# encoding: utf-8
require_relative '../models/table_registrar'

module CartoDB
  module Connector
    class SyncTable
      DEFAULT_SCHEMA = 'cdb_importer'

      attr_accessor :table

      def initialize(table_name, runner, table_registrar, quota_checker,
      database)
        @table_name       = table_name
        @runner           = runner
        @table_registrar  = table_registrar
        @quota_checker    = quota_checker
        @database         = database
      end

      def run(&tracker)
        runner.run(&tracker)
        result = results.select(&:success?).first

        if table_quota_exceeded?
          drop(result)
        else
          register(table_name, result) || overwrite(table_name, result)
        end

        self
      end

      def register(table_name, result)
        return false unless runner.remote_data_updated?
        return false if table_registrar.exists?(table_name)

        move_to_schema(result, 'public')
        rename(result.table_name, table_name)
      end

      def overwrite(table_name, result)
        return false unless runner.remote_data_updated?

        database.transaction do
          rename(table_name, 'to_be_deleted')
          rename(result.table_name, table_name)
          drop('to_be_deleted')
        end
      end

      def success?
        !table_quota_exceeded? && runner.success?
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE #{table_name}))
      rescue
        self
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

      def table_quota_exceeded?
        quota_checker.over_table_quota?(results.length)
      end

      def persist_metadata(name)
        table_registrar.register(user, name)
        @table = table_registrar.table
        self
      end

      def results
        runner.results
      end 

      def error_code
        return 8002 if table_quota_exceeded?
        results.map(&:error_code).compact.first
      end #errors_from

      private

      attr_reader :table_name, :runner, :table_registrar, :quota_checker,
                  :database
    end # SyncTable
  end # Connector
end # CartoDB

