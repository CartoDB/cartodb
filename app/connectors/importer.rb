# encoding: utf-8
require 'uuidtools'

module CartoDB
  module Connector
    class Importer
      ORIGIN_SCHEMA       = 'cdb_importer'
      DESTINATION_SCHEMA  = 'public'
      MAX_RENAME_RETRIES  = 5

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
          self.aborted = true
          drop(results)
        else
          results.select(&:success?).each { |result| register(result) }
        end

        self
      end

      def register(result)
        name = rename(result.table_name, result.name)
        move_to_schema(name, ORIGIN_SCHEMA, DESTINATION_SCHEMA)
        persist_metadata(name, data_import_id)
      rescue
      end

      def success?
        !over_table_quota? && runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result.qualified_table_name) }
      end

      def drop(table_name)
        database.execute(%Q(DROP TABLE #{table_name}))
      rescue
        self
      end

      def move_to_schema(table_name, origin_schema, destination_schema)
        return self if origin_schema == destination_schema
        database.execute(%Q{
          ALTER TABLE "#{origin_schema}"."#{table_name}"
          SET SCHEMA #{destination_schema}
        })
      end

      def rename(current_name, new_name, rename_attempts=0)
        new_name        = table_registrar.get_valid_table_name(new_name)

        if (rename_attempts > 0)
          new_name = "#{new_name}_#{rename_attempts}"
        end

        rename_attempts = rename_attempts + 1

        database.execute(%Q{
          ALTER TABLE "#{ORIGIN_SCHEMA}"."#{current_name}"
          RENAME TO "#{new_name}"
        })

        rename_the_geom_index_if_exists(current_name, new_name)
        new_name
      rescue
        retry unless rename_attempts > MAX_RENAME_RETRIES
      end

      def rename_the_geom_index_if_exists(current_name, new_name)
        database.execute(%Q{
          ALTER INDEX "#{ORIGIN_SCHEMA}"."#{current_name}_geom_idx"
          RENAME TO "the_geom_#{UUIDTools::UUID.timestamp_create.to_s.gsub('-', '_')}"
        })
      rescue
      end

      def persist_metadata(name, data_import_id)
        table_registrar.register(name, data_import_id)
        self.table = table_registrar.table
        self
      end

      def results
        runner.results
      end 

      def over_table_quota?
        aborted || quota_checker.over_table_quota?
      end

      def error_code
        return 8002 if over_table_quota?
        results.map(&:error_code).compact.first
      end

      private

      attr_reader :runner, :table_registrar, :quota_checker, :database,
      :data_import_id
      attr_accessor :aborted
    end # Importer
  end # Connector
end # CartoDB

