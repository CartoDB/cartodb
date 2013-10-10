# encoding: utf-8

module CartoDB
  module Synchronization
    class Adapter
      DESTINATION_SCHEMA = 'public'

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

        temporary_name = temporary_name_for(result.table_name)
        move_to_schema(result)

        database.transaction do
          rename(table_name, temporary_name) if exists?(table_name)
          rename(result.table_name, table_name)
          drop(temporary_name) if exists?(temporary_name)
        end
      end

      def success?
        runner.success?
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

      attr_reader :table_name, :runner, :database
    end # Synchronization
  end # Connector
end # CartoDB

