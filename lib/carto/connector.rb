# encoding: utf-8

require_relative 'connector/fdw_support'
require_relative 'connector/errors'
require_relative 'connector/providers'
require_relative 'connector/parameters'

module Carto
  # This class provides remote database connection services based on FDW
  class Connector

    attr_reader :name

    def initialize(parameters, options = {})
      @logger     = options[:logger]
      @user       = options[:user]

      @unique_suffix = UUIDTools::UUID.timestamp_create.to_s.delete('-') # .to_i.to_s(16) # or hash from user, etc.
      @params = Parameters.new(parameters)

      @name = @params[:provider]
      @name ||= DEFAULT_PROVIDER

      raise InvalidParametersError.new("Provider not defined") if @name.blank?
      @provider = PROVIDERS[@name].try :new, @params
      raise InvalidParametersError.new("Invalid provider: #{@name}") if @provider.blank?

      # @schema = @user.database_schema
    end

    def copy_table(schema_name:, table_name:)
      log "Connector Copy table  #{schema_name}.#{table_name}"
      validate!
      # TODO: logging with CartoDB::Logger
      begin
        qualified_table_name = %{"#{schema_name}"."#{table_name}"}
        foreign_table_name = @provider.foreign_table_name(foreign_prefix)
        log "Creating Server"
        execute_as_superuser create_server_command
        log "Creating Usermap"
        execute_as_superuser create_usermap_command
        log "Creating Foreign Table"
        execute_as_superuser create_foreign_table_command
        log "Copying Foreign Table"
        execute %{
          CREATE TABLE #{qualified_table_name} AS SELECT * FROM #{qualified_foreign_table_name(foreign_table_name)};
        }
      rescue => error
        log "Connector Error #{error}"
        raise error
      ensure
        log "Connector cleanup"
        execute_as_superuser drop_foreign_table_command(foreign_table_name) if foreign_table_name
        execute_as_superuser drop_usermap_command
        execute_as_superuser drop_server_command
        log "Connector cleaned-up"
      end
    end

    def remote_data_updated?
      # TODO: can we detect if query results have changed?
      true
    end

    def remote_table_name
      @provider.table_name
    end

    def self.check_availability!(user)
      unless user.has_feature_flag?('carto-connectors')
        raise ConnectorsDisabledError.new(user: user.username)
      end
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

    def validate!
      @provider.validate!
    end

    def log(message, truncate = true)
      @logger.append message, truncate if @logger
    end

    MAX_PG_IDENTIFIER_LEN = 60
    MIN_TAB_ID_LEN        = 10

    def server_name
      max_len = MAX_PG_IDENTIFIER_LEN - @unique_suffix.size - MIN_TAB_ID_LEN - 1
      connector_name = Carto::DB::Sanitize.sanitize_identifier @name
      connector_name[0...max_len]
      "#{connector_name.downcase}_#{@unique_suffix}"
    end

    def foreign_prefix
      "#{server_name}_"
    end

    def foreign_table_schema
      # since connectors' foreign table names are unique (because
      # server names are unique and not reused)
      # we could in principle use any schema (@schema, 'public', 'cdb_importer')
      CartoDB::Connector::Importer::ORIGIN_SCHEMA
    end

    def qualified_foreign_table_name(foreign_table_name)
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
      @provider.create_foreign_table_command server_name, foreign_table_schema,
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

    def drop_foreign_table_command(foreign_table_name)
      @provider.drop_foreign_table_command foreign_table_schema, foreign_table_name
    end

    def execute_as_superuser(command)
      @user.in_database(as: :superuser).execute command
    end

    def execute(command)
      @user.in_database.execute command
    end
  end
end
