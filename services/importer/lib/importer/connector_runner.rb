# encoding: utf-8

require 'carto/connector'
require_relative 'exceptions'
require_relative 'georeferencer'
require_relative 'runner_helper'

module CartoDB
  module Importer2
    # ConnectorRunner runs connector-based imports to import datasets from external databases.
    #
    # ConnectorRunner has the same public API as Runner, but
    # instead of downloading and unpacking files and then processing them with ogr2ogr to import them into
    # a user database table, a Connector instance connects directly to a remote database and imports
    # the specified dataset into a table in the user's database. Currently FDW are used for this.
    #
    # A connector runner is defined by a hash of parameters; the `provider` parameter is always required and specifies
    # the Connector class, which in turn defines the rest of valid parameters for the connector.
    #
    class ConnectorRunner
      include CartoDB::Importer2::RunnerHelper

      attr_reader :results, :log, :job, :warnings
      attr_accessor :stats

      def initialize(connector_source, options = {})
        @pg_options = options[:pg]
        @log        = options[:log] || new_logger
        @job        = options[:job] || new_job(@log, @pg_options)
        @user       = options[:user]
        @collision_strategy = options[:collision_strategy]
        @georeferencer      = options[:georeferencer] || new_georeferencer(@job)

        @id = @job.id
        @unique_suffix = @id.delete('-')
        @json_params = JSON.parse(connector_source)
        extract_params
        @connector = Carto::Connector.new(@params, user: @user, logger: @log)
        @results = []
        @tracker = nil
        @stats = {}
        @warnings = {}
        @connector.check_availability!
      end

      def run(tracker = nil)
        @tracker = tracker
        @job.log "ConnectorRunner #{@json_params.except('connection').to_json}"
        # TODO: logging with CartoDB::Logger
        table_name = @job.table_name
        if should_import?(@connector.remote_table_name)
          @job.log "Copy connected table"
          warnings = @connector.copy_table(schema_name: @job.schema, table_name: @job.table_name)
          @job.log 'Georeference geometry column'
          georeference
          @warnings.merge! warnings if warnings.present?
        else
          @job.log "Table #{table_name} won't be imported"
        end
      rescue => error
        @job.log "ConnectorRunner Error #{error}"
        @results.push result_for(@job.schema, table_name, error)
      else
        if should_import?(@connector.remote_table_name)
          @job.log "ConnectorRunner created table #{table_name}"
          @job.log "job schema: #{@job.schema}"
          @results.push result_for(@job.schema, table_name)
        end
      end

      def georeference
        @georeferencer.run
      rescue => error
        @job.log "ConnectorRunner Error while georeference #{error}"
      end

      def remote_data_updated?
        @connector.remote_data_updated?
      end

      def tracker
        @tracker || lambda { |state| state }
      end

      def visualizations
        # This method is needed to make the interface of ConnectorRunner compatible with Runner
        []
      end

      # General availability of connectors for a user
      def self.check_availability!(user)
        Carto::Connector.check_availability! user
      end

      def etag
        # This method is needed to make the interface of ConnectorRunner compatible with Runner,
        # but we have no meaningful data to return here.
      end

      def checksum
        # This method is needed to make the interface of ConnectorRunner compatible with Runner,
        # but we have no meaningful data to return here.
      end

      def last_modified
        # This method is needed to make the interface of ConnectorRunner compatible with Runner,
        # but we have no meaningful data to return here.
      end

      def provider_name
        @connector.provider_name
      end

      private

      # Parse @json_params and extract @params
      def extract_params
        @params = Carto::Connector::Parameters.new(@json_params)
      end

      def result_table_name
        Carto::DB::Sanitize.sanitize_identifier @connector.remote_table_name
      end

      def result_for(schema, table_name, error = nil)
        @job.success_status = !error
        @job.logger.store
        Result.new(
          name:           result_table_name,
          schema:         schema,
          tables:         [table_name],
          success:        @job.success_status,
          error_code:     error_for(error),
          log_trace:      @job.logger.to_s,
          support_tables: []
        )
      end

      def new_logger
        CartoDB::Log.new(type: CartoDB::Log::TYPE_DATA_IMPORT)
      end

      def new_job(log, pg_options)
        Job.new(logger: log, pg_options: pg_options)
      end

      def new_georeferencer(job)
        Georeferencer.new(job.db, job.table_name, {}, Georeferencer::DEFAULT_SCHEMA, job)
      end

      UNKNOWN_ERROR_CODE = 99999

      def error_for(exception)
        exception && ERRORS_MAP.fetch(exception.class, UNKNOWN_ERROR_CODE)
      end
    end
  end
end
