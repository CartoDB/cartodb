# encoding: utf-8
require 'uuidtools'

module CartoDB
  module Connector
    class Importer
      ORIGIN_SCHEMA       = 'cdb_importer'
      DESTINATION_SCHEMA  = 'public'
      MAX_RENAME_RETRIES  = 20

      attr_accessor :table

      # @param runner CartoDB::Importer2::Runner
      # @param table_registrar CartoDB::TableRegistrar
      # @param, quota_checker CartoDB::QuotaChecker
      def initialize(runner, table_registrar, quota_checker, database, data_import_id, destination_schema = nil)
        @aborted          = false
        @runner           = runner
        @table_registrar  = table_registrar
        @quota_checker    = quota_checker
        @database         = database
        @data_import_id   = data_import_id
        @destination_schema = destination_schema ? destination_schema : DESTINATION_SCHEMA
      end

      def run(tracker)
        runner.run(&tracker)

        if quota_checker.will_be_over_table_quota?(results.length)
          runner.log.append('Results would set overquota')
          @aborted = true
          results.each { |result|
            drop(result.table_name)
          }
        else
          runner.log.append('Proceeding to register')
          results.select(&:success?).each { |result|
            register(result)
          }
        end

        self
      end

      def register(result)
        runner.log.append("Before renaming from #{result.table_name} to #{result.name}")
        name = rename(result.table_name, result.name)
        runner.log.append("Before moving schema '#{name}' from #{ORIGIN_SCHEMA} to #{@destination_schema}")
        move_to_schema(name, ORIGIN_SCHEMA, @destination_schema)
        runner.log.append("Before persisting metadata '#{name}' data_import_id: #{data_import_id}")
        persist_metadata(name, data_import_id)
        runner.log.append("Table '#{name}' registered")
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
          SET SCHEMA \"#{destination_schema}\"
        })
      end

      def rename(current_name, new_name, rename_attempts=0)
        new_name = table_registrar.get_valid_table_name(new_name)

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
      rescue => exception
        runner.log.append("Silently retrying renaming #{current_name} to #{new_name}. ")
        if rename_attempts <= MAX_RENAME_RETRIES
          retry
        else
          raise CartoDB::Importer2::InvalidNameError.new
        end
      end

      def rename_the_geom_index_if_exists(current_name, new_name)
        database.execute(%Q{
          ALTER INDEX IF EXISTS "#{ORIGIN_SCHEMA}"."#{current_name}_geom_idx"
          RENAME TO "the_geom_#{UUIDTools::UUID.timestamp_create.to_s.gsub('-', '_')}"
        })
      rescue => exception
        runner.log.append("Silently failed rename_the_geom_index_if_exists from #{current_name} to #{new_name} with exception #{exception}. Backtrace: #{exception.backtrace.to_s}. ")
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
        @aborted || quota_checker.over_table_quota?
      end

      def error_code
        return 8002 if over_table_quota?
        results.map(&:error_code).compact.first
      end

      private

      attr_reader :runner, :table_registrar, :quota_checker, :database, :data_import_id
    end
  end
end

