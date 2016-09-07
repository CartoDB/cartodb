# encoding: utf-8

require_relative './exceptions'
require_relative './fdw_support'
require_relative './connector/errors'
require_relative './connector/providers'
require_relative './connector/parameters'

module CartoDB
  module Importer2
    # Connector instances are used to import datasets from external databases.
    #
    # Connector has the same public API as Runner, but
    # instead of downloading and unpacking files and then processing them with ogr2ogr to import them into
    # a user database table, a Connector instance connects directly to a remote database and imports
    # the specified dataset into a table in the user's database. Currently FDW are used for this.
    #
    # A connector is define by a hash of parameters; the `provider` parameter is always required and specifies
    # the connector Provider class, which in turn defines the rest of valid parameters for the connector.
    #
    class Connector

      attr_reader :results, :log, :job
      attr_accessor :stats

      def initialize(connector_source, options = {})
        @pg_options = options[:pg]
        @log        = options[:log] || new_logger
        @job        = options[:job] || new_job(@log, @pg_options)
        @user       = options[:user]

        @id = @job.id
        @unique_suffix = @id.delete('-')
        @json_params = connector_source
        extract_params
        @provider_name ||= DEFAULT_PROVIDER

        raise InvalidParametersError.new("Provider not defined") if @provider_name.blank?
        @provider = PROVIDERS[@provider_name].try :new, @params
        raise InvalidParametersError.new("Invalid provider: #{@provider_name}") if @provider.blank?
        @provider.validate!

        @schema = @user.database_schema
        @results = []
        @tracker = nil
        @stats = {}
      end

      def run(tracker = nil)
        @tracker = tracker
        @job.log "Connector #{@json_params}"
        # TODO: logging with CartoDB::Logger
        table_name = @job.table_name
        qualified_table_name = %{"#{@job.schema}"."#{table_name}"}
        @job.log "Creating Server"
        execute_as_superuser create_server_command
        @job.log "Creating Usermap"
        execute_as_superuser create_usermap_command
        @job.log "Creating Foreign Table"
        execute_as_superuser create_foreign_table_command
        @job.log "Copying Foreign Table"
        execute "CREATE TABLE #{qualified_table_name} AS SELECT * FROM #{qualified_foreign_table_name};"
      rescue => error
        @job.log "Connector Error #{error}"
        @results.push result_for(@job.schema, table_name, error)
      else
        @job.log "Connector created table #{table_name}"
        @job.log "job schema: #{@job.schema}"
        @results.push result_for(@job.schema, table_name)
      ensure
        @log.append_and_store "Connector cleanup"
        execute_as_superuser drop_foreign_table_command
        execute_as_superuser drop_usermap_command
        execute_as_superuser drop_server_command
        @log.append_and_store "Connector cleaned-up"
      end

      def success?
        results.count(&:success?) > 0
      end

      def remote_data_updated?
        # TODO: can we detect if query results have changed?
        true
      end

      def tracker
        @tracker || lambda { |state| state }
      end

      def visualizations
        # This method is needed to make the interface of Connector compatible with Runner
        []
      end

      def warnings
        # This method is needed to make the interface of Connector compatible with Runner
        []
      end

      def self.check_availability!(user)
        unless user.has_feature_flag?('carto-connectors')
          raise ConnectorsDisabledError.new(user: user.username)
        end
      end

      def etag
        # This method is needed to make the interface of Connector compatible with Runner,
        # but we have no meaningful data to return here.
      end

      def checksum
        # This method is needed to make the interface of Connector compatible with Runner,
        # but we have no meaningful data to return here.
      end

      def last_modified
        # This method is needed to make the interface of Connector compatible with Runner,
        # but we have no meaningful data to return here.
      end

      # Information about a connector features and parameters
      def self.information(provider_name)
        provider = PROVIDERS[provider_name]
        raise InvalidParametersError.new("Invalid provider: #{provider_name}") if provider.blank?
        provider.information
      end

      # List of available provider names
      def self.providers
        PROVIDERS.keys
      end

      private

      MAX_PG_IDENTIFIER_LEN = 60
      MIN_TAB_ID_LEN        = 10

      # Parse @json_params and extract @params
      def extract_params
        @params = Parameters.new(JSON.load(@json_params))
        @provider_name = @params[:provider]
      end

      def connector_name
        max_len = MAX_PG_IDENTIFIER_LEN - @unique_suffix.size - MIN_TAB_ID_LEN - 1
        name = Carto::DB::Sanitize.sanitize_identifier @provider_name
        name[0...max_len]
      end

      def server_name
        "connector_#{connector_name.downcase}_#{@unique_suffix}"
      end

      def foreign_prefix
        "#{server_name}_"
      end

      def result_table_name
        Carto::DB::Sanitize.sanitize_identifier @provider.table_name
      end

      def foreign_table_name
        max_len = MAX_PG_IDENTIFIER_LEN - foreign_prefix.size
        "#{foreign_prefix}#{result_table_name[0...max_len]}"
      end

      def foreign_table_schema
        # since connectors' foreign table names are unique (because
        # server names are unique and not reused)
        # we could in principle use any schema (@schema, 'public', 'cdb_importer')
        CartoDB::Connector::Importer::ORIGIN_SCHEMA
      end

      def qualified_foreign_table_name
        %{"#{foreign_table_schema}"."#{foreign_table_name}"}
      end

      def create_server_command
        @provider.create_server_command server_name
      end

      def create_usermap_command
        [
          @provider.create_usermap_command(server_name, @user.database_username),
          @provider.create_usermap_command(server_name, 'postgres')
        ].join("\n")
      end

      def create_foreign_table_command
        @provider.create_foreign_table_command server_name, foreign_table_schema, foreign_table_name,
                                               foreign_prefix,
                                               @user.database_username
      end

      def drop_server_command
        @provider.drop_server_command server_name
      end

      def drop_usermap_command
        [
          @provider.drop_usermap_command(server_name, 'postgres'),
          @provider.drop_usermap_command(server_name, @user.database_username)
        ].join("\n")
      end

      def drop_foreign_table_command
        @provider.drop_foreign_table_command foreign_table_schema, foreign_table_name
      end

      def execute_as_superuser(command)
        @user.in_database(as: :superuser).execute command
      end

      def execute(command)
        @user.in_database.execute command
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

      UNKNOWN_ERROR_CODE = 99999

      def error_for(exception)
        exception && ERRORS_MAP.fetch(exception.class, UNKNOWN_ERROR_CODE)
      end
    end
  end
end
