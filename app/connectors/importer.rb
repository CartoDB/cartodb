# encoding: utf-8
require 'uuidtools'

require_relative '../models/visualization/support_tables'
require_relative '../helpers/bounding_box_helper'

require_relative '../../services/importer/lib/importer/connectors/cdb_data_library_connector'

module CartoDB
  module Connector
    class Importer
      ORIGIN_SCHEMA       = 'cdb_importer'
      DESTINATION_SCHEMA  = 'public'
      MAX_RENAME_RETRIES  = 20

      attr_reader :imported_table_visualization_ids, :rejected_layers
      attr_accessor :table

      # @param runner CartoDB::Importer2::Runner
      # @param table_registrar CartoDB::TableRegistrar
      # @param quota_checker CartoDB::QuotaChecker
      # @param database
      # @param data_import_id String UUID
      # @param destination_schema String|nil
      # @param public_user_roles Array|nil
      def initialize(runner, table_registrar, quota_checker, database, data_import_id,
                     overviews_creator,
                     destination_schema = DESTINATION_SCHEMA, public_user_roles=[CartoDB::PUBLIC_DB_USER])
        @aborted                = false
        @runner                 = runner
        @table_registrar        = table_registrar
        @quota_checker          = quota_checker
        @database               = database
        @data_import_id         = data_import_id
        @overviews_creator      = overviews_creator
        @destination_schema     = destination_schema
        @support_tables_helper  = CartoDB::Visualization::SupportTables.new(database,
                                                                            {public_user_roles: public_user_roles})

        @imported_table_visualization_ids = []
        @rejected_layers = []
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
          results.select(&:success?).each { |result|
            create_overviews(result)
          }

          if runner.instance_of? CartoDB::Importer2::CDBDataLibraryConnector
            update_table_vis_with_remote_config
          end
          if data_import.create_visualization
            create_visualization
          end
        end

        self
      end

      def register(result)
        @support_tables_helper.reset

        if runner.instance_of? CartoDB::Importer2::CDBDataLibraryConnector
          name = result.name
        else
          # Sanitizing table name if it corresponds with a PostgreSQL reseved word
          result.name = "#{result.name}_t" if CartoDB::POSTGRESQL_RESERVED_WORDS.map(&:downcase).include?(result.name.downcase)
          runner.log.append("Before renaming from #{result.table_name} to #{result.name}")
          name = rename(result, result.table_name, result.name)
          result.name = name
          runner.log.append("Before moving schema '#{name}' from #{ORIGIN_SCHEMA} to #{@destination_schema}")
          move_to_schema(result, name, ORIGIN_SCHEMA, @destination_schema)
        end
        runner.log.append("Before persisting metadata '#{name}' data_import_id: #{data_import_id}")
        persist_metadata(result, name, data_import_id)
        runner.log.append("Table '#{name}' registered")
      rescue => exception
        if exception.message =~ /canceling statement due to statement timeout/i
          drop("#{ORIGIN_SCHEMA}.#{result.table_name}")
          raise CartoDB::Importer2::StatementTimeoutError.new(
            exception.message,
            CartoDB::Importer2::ERRORS_MAP[CartoDB::Importer2::StatementTimeoutError]
          )
        else
          raise exception
        end
      end

      def create_overviews(result)
        dataset = @overviews_creator.dataset(result.name)
        if dataset.should_create_overviews?
          dataset.create_overviews!
        end
      end

      def create_visualization
        tables = get_imported_tables
        if tables.length > 0
          user = ::User.where(id: data_import.user_id).first
          vis, @rejected_layers = CartoDB::Visualization::DerivedCreator.new(user, tables).create
          data_import.visualization_id = vis.id
          data_import.save
          data_import.reload
        end
      end

      def update_table_vis_with_remote_config
        begin
          tables = get_imported_tables
          if tables.length != 1
            runner.log.append("WARNING: Skipping remote vis metadata copy - imported more than one table")
            return
          end
          table = tables[0]
          if table.name != runner.foreign_table_name
            runner.log.append("WARNING: Skipping remote vis metadata copy - local #{table.name} != remote #{runner.foreign_table_name}")
            return
          end

          remote_api_key = Cartodb.config[:common_data]['api_key']
          if remote_api_key.blank?
            runner.log.append("Skipping remote visualization copy for new FDW import due to missing Cartodb.config[:common_data]['api_key']")
            return
          end

          # set some vars for use
          user = ::User.where(id: data_import.user_id).first
          http_client = Carto::Http::Client.get('fdw_vis_import', log_requests: true)

          remote_protocol = Cartodb.config[:common_data]['protocol']

          # Get visualization id of remote table so we can pull its layer configs
          if Cartodb.config[:common_data]['base_url']
            remote_base_url = Cartodb.config[:common_data]['base_url']
          else
            remote_protocol = Cartodb.config[:common_data]['protocol']
            remote_user = Cartodb.config[:common_data]['username']
            remote_base_url = "#{remote_protocol}://#{remote_user}.cartodb.com"
          end
          url = "#{remote_base_url}/api/v1/tables/#{runner.foreign_table_name}"
          response = http_client.get(url, params: {
            api_key: remote_api_key
          })
          if response.code != 200
            runner.log.append("Skipping remote vis copy: Error fetching #{url} - #{response.code} #{response.body}")
            return
          end
          data = JSON.parse(response.response_body)
          table_visualization_map_id = data['table_visualization']['map_id']
          table.alias = data['alias']
          table.schema_alias = data['schema_alias']
          table.save

          # Get remote vis layer configs
          url = "#{remote_base_url}/api/v1/maps/#{table_visualization_map_id}/layers"
          response = http_client.get(url, params: {
            api_key: remote_api_key
          })
          if response.code != 200
            runner.log.append("Skipping remote vis copy: Error fetching #{url} - #{response.code} #{response.body}")
            return
          end
          data = JSON.parse(response.response_body)
          remote_layers = data['layers']

          table.map.layers.each_with_index do |layer, index|
            layer_params = remote_layers[index]
            if layer_params.include?('options') && layer_params['options'].include?('table_name')
              layer_params['options']['table_name'] = layer.options['table_name']
            end
            if layer_params.include?('options') && layer_params['options'].include?('user_name')
              layer_params['options']['user_name'] = layer.options['user_name']
            end
            layer.raise_on_save_failure = true
            layer.update(layer_params.slice('options', 'kind', 'infowindow', 'tooltip', 'order'))
          end
        rescue => e
          runner.log.append("WARNING: Failed to import remote vis metadata - #{e}")
        end
      end

      def get_imported_tables
        tables = []
        @imported_table_visualization_ids.each do |table_id|
          vis = CartoDB::Visualization::Member.new(id: table_id).fetch
          tables << vis.table
        end
        tables
      end

      def success?
        !over_table_quota? && runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result.qualified_table_name) }
      end

      def drop(table_name)
        Carto::OverviewsService.new(database).delete_overviews table_name
        if runner.instance_of? CartoDB::Importer2::CDBDataLibraryConnector
            database.execute(%(DROP VIEW #{table_name}))
        else
            database.execute(%(DROP TABLE #{table_name}))
        end
      rescue => exception
        runner.log.append("Couldn't drop table #{table_name}: #{exception}. Backtrace: #{exception.backtrace} ")
        self
      end

      def move_to_schema(result, table_name, origin_schema, destination_schema)
        return self if origin_schema == destination_schema

        database.execute(%Q{
          ALTER TABLE "#{origin_schema}"."#{table_name}"
          SET SCHEMA "#{destination_schema}"
        })

        @support_tables_helper.tables = result.support_tables.map { |table|
          { schema: origin_schema, name: table }
        }
        @support_tables_helper.change_schema(destination_schema, table_name)
      rescue => e
        drop("#{origin_schema}.#{table_name}")
        raise e
      end

      def rename(result, current_name, new_name, rename_attempts=0)
        target_new_name = new_name
        new_name = table_registrar.get_valid_table_name(new_name)
        if rename_attempts > 0
          new_name = "#{new_name}_#{rename_attempts}"
        end
        rename_attempts = rename_attempts + 1

        if data_import
          user_id = data_import.user_id
          if exists_user_table_for_user_id(new_name, user_id)
            # Since get_valid_table_name should only return nonexisting table names (with a retry limit)
            # this is likely caused by a table deletion, so we run ghost tables to cleanup and retry
            if rename_attempts == 1
              runner.log.append("Triggering ghost tables for #{user_id} because collision on #{new_name}")
              ::User.where(id: user_id).first.link_ghost_tables

              if exists_user_table_for_user_id(new_name, user_id)
                runner.log.append("Ghost tables didn't fix the collision.")
                raise "Existing #{new_name} already registered for #{user_id}. Running ghost tables did not help."
              else
                runner.log.append("Ghost tables fixed the collision.")
              end
            else
              raise "Existing #{new_name} already registered for #{user_id}"
            end
          end
        end

        database.execute(%Q{
          ALTER TABLE "#{ORIGIN_SCHEMA}"."#{current_name}" RENAME TO "#{new_name}"
        })

        rename_the_geom_index_if_exists(current_name, new_name)

        @support_tables_helper.tables = result.support_tables.map { |table|
          { schema: ORIGIN_SCHEMA, name: table }
        }
        # Delay recreation of constraints until schema change
        results = @support_tables_helper.rename(current_name, new_name, recreate_constraints=false)

        if results[:success]
          result.update_support_tables(results[:names])
        else
          raise 'unsuccessful support tables renaming'
        end

        new_name
      rescue => exception
        CartoDB.notify_debug('Error while renaming at importer', { current_name: current_name, new_name: new_name, rename_attempts: rename_attempts, result: result.inspect, error: exception.inspect}) if rename_attempts == 1
        message = "Silently retrying renaming #{current_name} to #{target_new_name} (current: #{new_name}). ERROR: #{exception}"
        runner.log.append(message)
        if rename_attempts <= MAX_RENAME_RETRIES
          rename(result, current_name, target_new_name, rename_attempts)
        else
          drop("#{ORIGIN_SCHEMA}.#{current_name}")
          raise CartoDB::Importer2::InvalidNameError.new("#{message} #{rename_attempts} attempts. Data import: #{data_import_id}. ERROR: #{exception}")
        end
        raise exception
      end

      def rename_the_geom_index_if_exists(current_name, new_name)
        database.execute(%Q{
          ALTER INDEX IF EXISTS "#{ORIGIN_SCHEMA}"."#{current_name}_geom_idx"
          RENAME TO "the_geom_#{UUIDTools::UUID.timestamp_create.to_s.gsub('-', '_')}"
        })
      rescue => exception
        runner.log.append("Silently failed rename_the_geom_index_if_exists from #{current_name} to #{new_name} with exception #{exception}. Backtrace: #{exception.backtrace.to_s}. ")
      end

      def persist_metadata(result, name, data_import_id)
        table_registrar.register(name, data_import_id)
        @table = table_registrar.table
        @imported_table_visualization_ids << @table.table_visualization.id
        BoundingBoxHelper.update_visualizations_bbox(table)
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

      def data_import
        @data_import ||= DataImport[@data_import_id]
      end

      private

      def exists_user_table_for_user_id(table_name, user_id)
        !Carto::UserTable.where(name: table_name, user_id: user_id).first.nil?
      end

      attr_reader :runner, :table_registrar, :quota_checker, :database, :data_import_id

    end
  end
end
