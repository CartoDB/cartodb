# encoding: utf-8

require_relative './exceptions'

module CartoDB
  module Importer2
    class Connector
      # Requirements:
      #   * odbc_fdw extension must be installed in the user database

      class ConnectorError < StandardError
        attr_reader :user_name

        def initialize(message = 'General error', user = nil)
          @user_name = user && user.username
          message = message.to_s
          message << " User: #{@user_name}" if @user_name
          super(message)
        end

        def error_code
          ERRORS_MAP.fetch(self.class, UNKNOWN_ERROR_CODE)
        end
      end

      class InvalidParametersError < ConnectorError
      end

      class ConnectorsDisabledError < ConnectorError # ServiceDisabledError ?
        def initialize(message = 'CARTO-Connectors disabled', user = nil)
          super message: message, user: user
        end
      end

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
        validate_params!
        @schema = @user.database_schema
        @results = []
        @tracker = nil
        @stats = {}
      end

      def run(tracker = nil)
        @tracker = tracker
        @job.log "Connector #{@json_params}"
        # TODO: deal with schemas, org users, etc.,
        # TODO: logging with CartoDB::Logger
        table_name = @job.table_name
        qualified_table_name = %{"#{@job.schema}"."#{table_name}"}
        @job.log "Creating Server"
        execute_as_superuser create_server_command
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
        []
      end

      def warnings
        []
      end

      def self.check_availability!(user)
        unless user.has_feature_flag?('carto-connectors')
          raise ConnectorsDisabledError.new(user: user.username)
        end
      end

      private

      ACCEPTED_PARAMETERS = %w(connection schema table sql_query sql_count encoding).freeze
      SERVER_OPTIONS = %w(dsn driver host port database).freeze
      REQUIRED_PARAMETERS = %w(connection table).freeze

      def server_params
        @params['connection'].slice(*SERVER_OPTIONS)
      end

      def table_params
        @params['connection'].except(*SERVER_OPTIONS).merge(@params.except('connection'))
      end

      # Parse @json_params and extract @params
      def extract_params
        @params = JSON.load(@json_params)

        # Extract columns of the result table from the parameters
        # Column definitions are expected in SQL syntax, e.g.
        #     columns=id int, name text
        @columns = @params.delete 'columns'
        @columns = @columns.split(',').map(&:strip) if @columns
      end

      def validate_params!
        errors = []
        invalid_params = @params.keys - ACCEPTED_PARAMETERS
        missing_parameters = REQUIRED_PARAMETERS - @params.keys
        if missing_parameters.present?
          errors << "Missing required parameters #{missing_parameters * ','}"
        end
        errors += connection_params_errors(@params['connection'])
        errors << "Invalid parameters: #{invalid_params * ', '}" if invalid_params.present?
        raise InvalidParametersError.new(errors * "\n") if errors.present?
      end

      def connection_params_errors(params)
        errors = []
        if params.blank?
          errors << "Connection parameters are missing"
        elsif params['dsn'].blank? && (params['driver'].blank? || params['database'].blank?)
          errors << "Missing required connection parameters"
        end
        errors
      end

      def connector_name
        @params['connection']['dsn'] || @params['connection']['driver']
      end

      def server_name
        "connector_#{connector_name.downcase}_#{@unique_suffix}"
      end

      def foreign_prefix
        "#{server_name}_"
      end

      def foreign_table_name
        "#{foreign_prefix}#{@params['table'] || 'table'}"
      end

      def foreign_table_schema
        # since connectors' foreign table names are unique (because
        # server names are unique and not reused)
        # we could in principle use any schema (@schema, 'public', 'cdb_importer')
        CartoDB::Connector::Importer::ORIGIN_SCHEMA
      end

      def qualified_foreign_table_name
        %{"#{foreign_table_schema}".#{foreign_table_name}}
      end

      def create_server_command
        options = server_params.map { |k, v| "#{k} '#{v}'" } * ",\n"
        %{
          CREATE SERVER #{server_name}
            FOREIGN DATA WRAPPER odbc_fdw
            OPTIONS (#{options});
          CREATE USER MAPPING FOR "#{@user.database_username}" SERVER #{server_name};
          CREATE USER MAPPING FOR postgres SERVER #{server_name};
        }
      end

      def create_foreign_table_command
        options = table_params
        if @columns.present?
          options_list = options.map { |k, v| "#{k} '#{v}'" } * ",\n"
          %{
            CREATE FOREIGN TABLE #{qualified_foreign_table_name} (#{@columns * ','})
              SERVER #{server_name}
              OPTIONS (#{options_list});
            GRANT SELECT ON #{qualified_foreign_table_name} TO "#{@user.database_username}";
           }
        else
          options = options.merge(prefix: foreign_prefix)
          options_list = options.map { |k, v| "#{k} '#{v}'" } * ",\n"
          %{
            IMPORT FOREIGN SCHEMA #{@params['schema'] || @params['connection']['database'] || 'schema'}
              FROM SERVER #{server_name}
              INTO #{foreign_table_schema}
              OPTIONS (#{options_list});
            GRANT SELECT ON #{qualified_foreign_table_name} TO "#{@user.database_username}";
           }
        end
      end

      def drop_server_command
        "DROP SERVER IF EXISTS #{server_name} CASCADE;"
      end

      def drop_foreign_table_command
        %{DROP FOREIGN TABLE IF EXISTS #{qualified_foreign_table_name} CASCADE;}
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
          name:           @params['table'],
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
