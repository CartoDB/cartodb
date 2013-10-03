# encoding: utf-8

module CartoDB
  module Connector
    class Importer
      DEFAULT_SCHEMA = 'cdb_importer'

      attr_accessor :table

      def initialize(runner, table_registrar, quota_checker, database)
        @runner           = runner
        @table_registrar  = table_registrar
        @quota_checker    = quota_checker
        @database         = database
      end

      def run(tracker)
        runner.run(&tracker)

        if table_quota_exceeded?
          drop(results)
        else
          results.select(&:success?).each { |result| register(result) }
        end

        self
      end

      def register(result)
        move_to_schema(result, 'public')
        rename(result.table_name, result.name)
      end

      def success?
        !table_quota_exceeded? && runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result.qualified_table_name) }
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

      def rename(current_name, new_name, rename_attempts=0)
        rename_attempts = rename_attempts + 1
        new_name        = table_registrar.get_valid_table_name(new_name)

        database.execute(%Q{
          ALTER TABLE "public"."#{current_name}"
          RENAME TO "#{new_name}"
        })
        persist_metadata(new_name)
      rescue => exception
        retry unless rename_attempts > 1
      end

      def table_quota_exceeded?
        quota_checker.over_table_quota?(results.length)
      end

      def persist_metadata(name)
        table_registrar.register(name)
        self.table = table_registrar.table
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

      attr_reader :runner, :table_registrar, :quota_checker, :database
    end # Importer
  end # Connector
end # CartoDB

