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
        @rename_attempts  = 0
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
        name = rename(result)
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
          SET SCHEMA "#{destination_schema}"
        })
      end

      def rename(result)
        new_name = table_registrar.get_valid_table_name(result.name)

        if @rename_attempts > 0
          new_name = "#{new_name}_#{@rename_attempts}"
        end
        @rename_attempts += 1

        database.execute(%Q{
          ALTER TABLE "#{ORIGIN_SCHEMA}"."#{result.table_name}"
          RENAME TO "#{new_name}"
        })

        rename_the_geom_index_if_exists(result.table_name, new_name)

        support_tables_new_names = []

        result.support_tables.each { |support_table_name|
          new_support_table_name = support_table_name.dup
          # CONVENTION: support_tables will always end in "_tablename", so we substitute
          new_support_table_name.slice!(-result.table_name.length, result.table_name.length)
          new_support_table_name = "#{new_support_table_name}#{new_name}"

          database.execute(%Q{
            ALTER TABLE "#{ORIGIN_SCHEMA}"."#{support_table_name}"
            RENAME TO "#{new_support_table_name}"
          })

          recreate_raster_constraints_if_exists(new_support_table_name, new_name)

          support_tables_new_names.push(new_support_table_name)
        }

        @rename_attempts = 0

        result.update_support_tables(support_tables_new_names)

        new_name
      rescue => exception
        retry unless @rename_attempts > MAX_RENAME_RETRIES
        @rename_attempts = 0
      end

      # @see http://postgis.net/docs/manual-dev/using_raster_dataman.html#RT_Raster_Overviews
      def recreate_raster_constraints_if_exists(overview_table_name, raster_table_name)
        constraint = database.fetch(%Q{
          SELECT o_table_name, o_raster_column, r_table_name, r_raster_column, overview_factor
          FROM raster_overviews WHERE o_table_name = '#{overview_table_name}'
        }).first
        return if constraint.nil?

        # @see http://postgis.net/docs/RT_DropOverviewConstraints.html
        database.execute(%Q{
          SELECT DropOverviewConstraints('#{ORIGIN_SCHEMA}', '#{constraint[:o_table_name]}',
                                         '#{constraint[:o_raster_column]}')
        })
        # @see http://postgis.net/docs/manual-dev/RT_AddOverviewConstraints.html
        database.execute(%Q{
          SELECT AddOverviewConstraints('#{ORIGIN_SCHEMA}', '#{constraint[:o_table_name]}',
                                        '#{constraint[:o_raster_column]}', '#{ORIGIN_SCHEMA}', '#{raster_table_name}',
                                        '#{constraint[:r_raster_column]}', #{constraint[:overview_factor]});
        })
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

