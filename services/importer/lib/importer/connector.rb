# encoding: utf-8

require_relative './exceptions'

module CartoDB
  module Importer2
    class Connector
      # Requirements in user db host: odbc_fdw extension deployed

      # Temptative terminology
      # * connector channel (ODBC, ...)
      # * provider          (MySQL, ...)     [driver]
      # * connection        (database/query) [specific data source]

      class ConnectorError < StandardError
        attr_reader :channel_name, :user_name

        def initialize(message = 'General error', channel = nil, user = nil)
          @channel_name  = channel
          @user_name     = user && user.username
          message = "#{message}"
          message << " Channel: #{@channel_name}" if @channel_name
          message << " User: #{@user_name}" if @user_name
          super(message)
        end
      end

      class InvalidChannelError < ConnectorError
        def initialize(channel, user = nil)
          super "Invalid channel", channel, user
        end
      end

      class InvalidParametersError < ConnectorError
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
        channel, conn_str = connector_source.split(':')
        raise InvalidChannelError.new(channel, @user) unless channel.downcase == 'odbc'
        @conn_str = conn_str
        # TODO: parser params properly, make param names lowercase
        @params = Hash[@conn_str.split(';').map { |p| p.split('=').map(&:strip) }]
        # Temporary hack to allow equal signs in parameter values (e.g. sql_query):
        # the equal sign should be codified as .eq.
        @params = Hash[@params.map { |k, v| [k, v.gsub('.eq.', '=').gsub('.sc.', ';')] }]
        # TODO: use IMPORT FOREIGH SCHEMA with query options to create table
        # and thus avoid the need for the columns.
        @columns = @params.delete 'columns'
        @columns = @columns.split(',') if @columns
        validate_params!
        @schema = @user.database_schema
        @results = []
        @tracker = nil
        @stats = {}
      end

      def run(tracker = nil)
        @tracker = tracker
        @job.log "Connector #{@conn_str}"
        # TODO: deal with schemas, org users, etc.,
        # TODO: logging with CartoDB::Logger
        table_name = @job.table_name
        qualified_table_name = %{"#{@job.schema}"."#{table_name}"}
        execute_as_superuser "CREATE EXTENSION IF NOT EXISTS odbc_fdw;"
        @job.log "Creating Server"
        execute_as_superuser create_server_command
        @job.log "Creating Foreign Table"
        execute_as_superuser create_foreign_table_command
        @job.log "Copying Foreign Table"
        execute "CREATE TABLE #{qualified_table_name} AS SELECT * FROM #{foreign_table_name};"
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

      private

      ACCEPTED_PARAMETERS = %w(dsn driver host port database table username password sql_query sql_count)
      SERVER_OPTIONS = %w(dsn driver host port database)

      def server_params
        @params.slice(*SERVER_OPTIONS)
      end

      def table_params
        @params.except(*SERVER_OPTIONS)
      end

      def validate_params!
        errors = []
        if @params['dsn'].blank? &&
           (@params['driver'].blank? || @params['database'].blank? || @params['table'].blank?)
          errors << "Missing required parameters"
        end
        errors << "Missing columns definition" unless @columns.present?
        invalid_params = @params.keys - ACCEPTED_PARAMETERS
        errors << "Invalid parameters: #{invalid_params * ', '}" if invalid_params.present?
        raise InvalidParametersError.new(errors * "\n") if errors.present?
      end

      def connector_name
        @params['dsn'] || @params['driver']
      end

      def server_name
        "connector_#{connector_name}_#{@unique_suffix}"
      end

      def foreign_table_name
        "#{server_name}_#{@params['table']}"
      end

      def create_server_command
        options = server_params.map { |k, v| "#{k} '#{v}'" } * ",\n"
        %{
          CREATE SERVER #{server_name}
            FOREIGN DATA WRAPPER odbc_fdw
            OPTIONS (#{options});
          CREATE USER MAPPING FOR "#{@user.database_username}" SERVER #{server_name};
        }
      end

      def create_foreign_table_command
        options = table_params.map { |k, v| "#{k} '#{v}'" } * ",\n"
        %{
          CREATE FOREIGN TABLE #{foreign_table_name} (#{@columns * ','})
            SERVER #{server_name}
            OPTIONS (#{options});
          GRANT SELECT ON #{foreign_table_name} TO "#{@user.database_username}";
        }
      end

      def drop_server_command
        "DROP SERVER IF EXISTS #{server_name} CASCADE;"
      end

      def drop_foreign_table_command
        "DROP FOREIGN TABLE IF EXISTS #{foreign_table_name} CASCADE;"
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
