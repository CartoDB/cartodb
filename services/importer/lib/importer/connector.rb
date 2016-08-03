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

      ACCEPTED_PARAMETERS = %w(connection schema table sql_query sql_count encoding columns).freeze
      REQUIRED_PARAMETERS = %w(connection table).freeze

      SERVER_OPTIONS = %w(dsn driver host server address port database).freeze
      USER_OPTIONS   = %w(uid pwd user username password).freeze

      def fetch_ignoring_case(hash, key)
        if hash
          _k, v = hash.find { |k, _v| k.to_s.casecmp(key.to_s) == 0 }
          v
        end
      end

      def connection_options(options)
        # Prefix option names with "odbc_"
        Hash[options.map { |option_name, option_value| ["odbc_#{option_name}", option_value] }]
      end

      def server_params
        params = @connection.select { |k, _v| k.downcase.in? SERVER_OPTIONS }
        connection_options params
      end

      def user_params
        params = @connection.select { |k, _v| k.downcase.in? USER_OPTIONS }
        connection_options params
      end

      def table_params
        params = @connection.reject { |k, _v| k.downcase.in? SERVER_OPTIONS + USER_OPTIONS }
        connection_options(params).merge(@options)
      end

      # Parse @json_params and extract @params
      def extract_params
        @params = JSON.load(@json_params)

        # parameters that will be passed in the OPTIONS clause
        @options = @params.dup

        # Extract columns of the result table from the parameters
        # Column definitions are expected in SQL syntax, e.g.
        #     columns=id int, name text
        @columns = @options.delete 'columns'
        @columns = @columns.split(',').map(&:strip) if @columns

        @connection = @options.delete 'connection'
        @dsn        = fetch_ignoring_case(@connection, 'dsn')
        @driver     = fetch_ignoring_case(@connection, 'driver')
      end

      def validate_params!
        errors = []
        invalid_params = @params.keys - ACCEPTED_PARAMETERS
        missing_parameters = REQUIRED_PARAMETERS - @params.keys
        if missing_parameters.present?
          errors << "Missing required parameters #{missing_parameters * ','}"
        end
        errors += connection_params_errors
        errors << "Invalid parameters: #{invalid_params * ', '}" if invalid_params.present?
        raise InvalidParametersError.new(errors * "\n") if errors.present?
      end

      def connection_params_errors
        errors = []
        if @connection.blank?
          errors << "Connection parameters are missing"
        elsif @dsn.blank? && @driver.blank?
          errors << "Missing required connection parameters"
        end
        errors
      end

      def connector_name
        Carto::DB::Sanitize.sanitize_identifier @dsn || @driver
      end

      def server_name
        "connector_#{connector_name.downcase}_#{@unique_suffix}"
      end

      def foreign_prefix
        "#{server_name}_"
      end

      def result_table_name
        Carto::DB::Sanitize.sanitize_identifier @options['table']
      end

      def foreign_table_name
        "#{foreign_prefix}#{result_table_name}"
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
        %{
          CREATE SERVER #{server_name}
            FOREIGN DATA WRAPPER odbc_fdw
            #{options_clause(server_params)};
          CREATE USER MAPPING FOR "#{@user.database_username}"
            SERVER #{server_name}
            #{options_clause(user_params)};
          CREATE USER MAPPING FOR postgres
            SERVER #{server_name}
            #{options_clause(user_params)};
        }
      end

      def create_foreign_table_command
        if @columns.present?
          %{
            CREATE FOREIGN TABLE #{qualified_foreign_table_name} (#{@columns * ','})
              SERVER #{server_name}
              #{options_clause(table_params)};
            GRANT SELECT ON #{qualified_foreign_table_name} TO "#{@user.database_username}";
           }
        else
          options = table_params.merge(prefix: foreign_prefix)
          schema = @options['schema'] ||
                   fetch_ignoring_case(@connection, 'schema') ||
                   fetch_ignoring_case(@connection, 'database')
          %{
            IMPORT FOREIGN SCHEMA #{schema}
              FROM SERVER #{server_name}
              INTO #{foreign_table_schema}
              #{options_clause(options)};
            GRANT SELECT ON #{qualified_foreign_table_name} TO "#{@user.database_username}";
           }
        end
      end

      def quote_option_name(option)
        if option && option.downcase != option
          %{"#{option}"}
        else
          option
        end
      end

      def options_clause(options)
        if options.present?
          options_list = options.map { |k, v| "#{quote_option_name k} '#{escape_single_quotes v}'" } * ",\n"
          "OPTIONS (#{options_list})"
        else
          ''
        end
      end

      def escape_single_quotes(text)
        text.to_s.gsub("'", "''")
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
