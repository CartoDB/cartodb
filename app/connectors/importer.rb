require 'carto/importer/table_setup'

require_relative '../models/visualization/support_tables'
require_relative '../../lib/carto/ghost_tables_manager'
require_dependency 'carto/db/user_schema'
require_dependency 'visualization/derived_creator'

module CartoDB
  module Connector
    class Importer
      include ::LoggerHelper

      ORIGIN_SCHEMA       = 'cdb_importer'
      DESTINATION_SCHEMA  = 'public'
      MAX_RENAME_RETRIES  = 20

      # The following columns are not validated because we are comparing schemas of a cartodbfied table and one that
      # is about to be imported.
      COLUMNS_NOT_TO_VALIDATE = [:cartodb_id, :the_geom_webmercator].freeze

      attr_reader :imported_table_visualization_ids, :rejected_layers
      attr_accessor :table

      # @param runner CartoDB::Importer2::Runner
      # @param table_registrar CartoDB::TableRegistrar
      # @param quota_checker CartoDB::QuotaChecker
      # @param database
      # @param data_import_id String UUID
      # @param destination_schema String|nil
      # @param public_user_roles Array|nil
      def initialize(runner:, table_registrar:, quota_checker:, database:, data_import_id:, overviews_creator: nil,
                     destination_schema: DESTINATION_SCHEMA, public_user_roles: [CartoDB::PUBLIC_DB_USER],
                     collision_strategy: nil)
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
        @collision_strategy = collision_strategy
        @table_setup = ::Carto::Importer::TableSetup.new(
          user: user,
          overviews_creator: overviews_creator,
          log: runner.log
        )
      end

      def run(tracker)
        runner.run(&tracker)

        if quota_checker.will_be_over_table_quota?(results.length)
          log('Results would set overquota')
          @aborted = true
          results.each { |result| drop(result.table_name) }
        else
          check_dataset_quotas(runner.visualizations)
          log('Proceeding to register')
          register_results(results)
          create_visualization if data_import.create_visualization
        end
        self
      end

      def check_dataset_quotas(visualizations)
        log('Checking public datasets quota')
        public_datasets = visualizations.select do |v|
          v.type == Carto::Visualization::TYPE_CANONICAL && v.privacy != Carto::Visualization::PRIVACY_PRIVATE
        end
        quota_checker = CartoDB::QuotaChecker.new(data_import.user)
        return unless quota_checker.will_be_over_public_dataset_quota?(public_datasets.count)

        log('Results would set dataset overquota')
        raise CartoDB::Importer2::PublicDatasetQuotaExceededError.new
      end

      def register_results(results)
        Carto::GhostTablesManager.run_synchronized(
          user.id, attempts: 10, timeout: 3000,
          message: "Couldn't acquire bolt to register. Registering without bolt",
          current_user: user,
          data_import: { id: data_import.id }
        ) do
          results.select(&:success?).each do |result|
            register(result)
          end
        end
      end

      def register(result)
        @support_tables_helper.reset
        log("Before renaming from #{result.table_name} to #{result.name}")

        names_taken = overwrite_strategy? ? [] : taken_names
        name = Carto::ValidTableNameProposer.new.propose_valid_table_name(result.name, taken_names: names_taken)

        overwrite = overwrite_strategy? && taken_names.include?(name)

        if overwrite
          raise ::CartoDB::Importer2::IncompatibleSchemas.new unless compatible_schemas_for_overwrite?(name)
          move_to_schema(result, result.table_name, ORIGIN_SCHEMA, @destination_schema)
          overwrite_register(result, name) do
            drop("\"#{@destination_schema}\".\"#{name}\"")
            rename(result, result.table_name, name, @destination_schema)
          end
        else
          new_register(name, result)
        end

        result.name = name

        log("Before persisting metadata '#{name}' data_import_id: #{data_import_id}")
        persist_metadata(name, data_import_id, overwrite)

        log("Table '#{name}' registered")
      rescue ::CartoDB::Importer2::IncompatibleSchemas => exception
        drop("#{ORIGIN_SCHEMA}.#{result.table_name}")
        raise exception
      rescue StandardError => exception
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

      def create_visualization
        if runner.visualizations.empty?
          create_default_visualization
        else
          user = Carto::User.find(data_import.user_id)
          renamed_tables = results.map { |r| [r.original_name, r.name] }.to_h
          runner.visualizations.each do |visualization|
            persister = Carto::VisualizationsExportPersistenceService.new
            vis = persister.save_import(user, visualization, renamed_tables: renamed_tables)
            bind_visualization_to_data_import(vis)
          end
        end
      end

      def create_default_visualization
        tables = get_imported_tables
        if tables.length > 0
          user = ::User.where(id: data_import.user_id).first
          vis, @rejected_layers = CartoDB::Visualization::DerivedCreator.new(user, tables).create
          bind_visualization_to_data_import(vis)
        end
      end

      def bind_visualization_to_data_import(vis)
        data_import.visualization_id = vis.id
        data_import.save
        data_import.reload
      end

      def get_imported_tables
        @imported_table_visualization_ids.map do |table_id|
          Carto::Visualization.find(table_id).table
        end
      end

      def success?
        !over_table_quota? && runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result.qualified_table_name) }
      end

      def drop(table_name)
        return if table_name.blank?

        Carto::OverviewsService.new(database).delete_overviews table_name
        database.execute(%(DROP TABLE #{table_name}))
      rescue StandardError => exception
        log("Couldn't drop table #{table_name}: #{exception}. Backtrace: #{exception.backtrace} ")
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
      rescue StandardError => e
        drop("#{origin_schema}.#{table_name}")
        raise e
      end

      # Restore the permissions (roles) for the table.
      # These roles were dropped after the original table was
      # replaced by the importer.
      def restore_permissions_for(table_name)
        # get the api keys of the original table
        api_keys_table = Carto::ApiKey.where(user_id: user.id).select do |api_key|
          api_key.grants.any? do |grant|
            tables = grant[:tables]
            next unless tables
            tables.any? do |table|
              table[:name] == table_name
            end
          end
        end

        api_keys_table.each { |api_key| api_key.setup_table_permissions }
      end

      # Renames table from current_name to new_name.
      # It doesn't check if `new_name` is valid. To get a valid name use `Carto::ValidTableNameProposer`
      def rename(result, current_name, new_name, schema)
        database.execute(%{
          ALTER TABLE "#{schema}"."#{current_name}" RENAME TO "#{new_name}"
        })

        rename_the_geom_index_if_exists(current_name, new_name, schema)

        @support_tables_helper.tables = result.support_tables.map { |table|
          { schema: schema, name: table }
        }

        # Delay recreation of constraints until schema change
        results = @support_tables_helper.rename(current_name, new_name, false)

        if results[:success]
          result.update_support_tables(results[:names])
        else
          raise 'unsuccessful support tables renaming'
        end

        new_name
      rescue StandardError => exception
        drop("#{schema}.#{current_name}")
        raise exception
      end

      def rename_the_geom_index_if_exists(current_name, new_name, schema)
        database.execute(%Q{
          ALTER INDEX IF EXISTS "#{schema}"."#{current_name}_geom_idx"
          RENAME TO "the_geom_#{Carto::UUIDHelper.random_uuid.gsub('-', '_')}"
        })
      rescue StandardError => exception
        log("Silently failed rename_the_geom_index_if_exists from " +
            "#{current_name} to #{new_name} with exception #{exception}. " +
            "Backtrace: #{exception.backtrace}. ")
      end

      def persist_metadata(name, data_import_id, overwrite_table)
        user_table = overwrite_strategy? ? Carto::UserTable.where(user_id: user.id, name: name).first : nil
        table_registrar.register(name, data_import_id, user_table)
        @table = table_registrar.table
        @imported_table_visualization_ids << @table.table_visualization.id unless overwrite_table
        table.update_bounding_box
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

      def overwrite_register(result, name)
        table_statements = @table_setup.generate_table_statements(@destination_schema, name)

        database.transaction do
          log("Replacing #{name} with #{result.table_name}")
          begin
            # the logic inside the transaction may vary, so we let the caller to implement it
            yield(database, @destination_schema)
          rescue StandardError => e
            log("Unable to replace #{name} with #{result.table_name}. Rollingback transaction and dropping #{result.table_name}: #{e}")
            drop("\"#{@destination_schema}\".\"#{result.table_name}\"")
            raise e
          end
        end

        @table_setup.cartodbfy(name)
        @table_setup.fix_oid(name)
        @table_setup.run_table_statements(table_statements, @database)
        @table_setup.sanitize_columns(name)
        @table_setup.update_cdb_tablemetadata(name)
        restore_permissions_for(name)
      end

      def last_modified
        runner.last_modified
      end

      private

      def new_register(name, result)
        database.transaction do
          rename(result, result.table_name, name, ORIGIN_SCHEMA)
          begin
            log("Before moving schema '#{name}' from #{ORIGIN_SCHEMA} to #{@destination_schema}")
            move_to_schema(result, name, ORIGIN_SCHEMA, @destination_schema)
          rescue StandardError => e
            log("Error replacing data in import: #{e}: #{e.backtrace}")
            raise e
          end
        end
      end

      def compatible_schemas_for_overwrite?(name)
        orig_schema = user.in_database.schema(results.first.tables.first, reload: true, schema: ORIGIN_SCHEMA)
        dest_schema = user.in_database.schema(name, reload: true, schema: user.database_schema)

        # NOTE: Sanitize columnn names from 'orig_schema' due to the 'dest_schema' columns were
        #       already sanitized before table creation in `Table#before_create`
        orig_schema.each do |column|
          column[0] = CartoDB::Importer2::Column.get_valid_column_name(
            column.first.to_s,
            data_import&.column_sanitization_version || CartoDB::Importer2::Column::NO_COLUMN_SANITIZATION_VERSION,
            orig_schema.map(&:first).map(&:to_s)
          ).to_sym
        end

        dest_schema.each do |dest_row|
          next if COLUMNS_NOT_TO_VALIDATE.include?(dest_row[0])
          return false unless orig_schema.any? { |orig_row| rows_assignable?(dest_row, orig_row) }
        end
        true
      end

      def rows_assignable?(dest_row, orig_row)
        (orig_row[0] == :the_geom && orig_row[0] == dest_row[0] && dest_row[1][:db_type].include?(orig_row[1][:db_type])) ||
          (orig_row[0] == dest_row[0] && orig_row[1][:db_type].convert_to_cartodb_type == dest_row[1][:db_type].convert_to_cartodb_type)
      end

      def user
        table_registrar.user
      end

      def overwrite_strategy?
        @collision_strategy == Carto::DataImportConstants::COLLISION_STRATEGY_OVERWRITE
      end

      def log(message)
        runner.log.append(message)
      end

      def exists_user_table_for_user_id(table_name, user_id)
        !Carto::UserTable.where(name: table_name, user_id: user_id).first.nil?
      end

      def taken_names
        Carto::Db::UserSchema.new(table_registrar.user).table_names
      end

      attr_reader :runner, :table_registrar, :quota_checker, :database, :data_import_id

    end
  end
end
