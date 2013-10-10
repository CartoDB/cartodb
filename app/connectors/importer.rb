# encoding: utf-8

module CartoDB
  module Connector
    class Importer
      DESTINATION_SCHEMA = 'public'

      attr_accessor :table

      def initialize(runner, table_registrar, quota_checker, database,
      data_import_id)
        @runner           = runner
        @table_registrar  = table_registrar
        @quota_checker    = quota_checker
        @database         = database
        @data_import_id   = data_import_id
      end

      def run(tracker)
        runner.run(&tracker)

        if quota_checker.will_be_over_table_quota?(results.length)
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
        !quota_checker.over_table_quota? && runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result.qualified_table_name) }
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE #{table_name}))
      rescue
        self
      end

      def move_to_schema(result, schema=DESTINATION_SCHEMA)
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
        persist_metadata(new_name, data_import_id)
      rescue => exception
        retry unless rename_attempts > 1
      end

      def persist_metadata(name, data_import_id)
        table_registrar.register(name, data_import_id)
        self.table = table_registrar.table
        self
      end

      def results
        runner.results
      end 

      def error_code
        return 8002 if quota_checker.over_table_quota?
        results.map(&:error_code).compact.first
      end #errors_from

      private

      attr_reader :runner, :table_registrar, :quota_checker, :database,
      :data_import_id
    end # Importer
  end # Connector
end # CartoDB

