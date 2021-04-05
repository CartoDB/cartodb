module Carto
  # ConnectionAdapter is a base class to provide additional connector-specific functionality to Connections
  class ConnectionAdapter

    CONFIDENTIAL_PARAMETER_PLACEHOLDER = '********'.freeze
    CONFIDENTIAL_PARAMS = %w(password).freeze
    CLOUD_CONNECTORS = %w(snowflake redshift postgres)

    def initialize(connection, confidential_parameters: CONFIDENTIAL_PARAMS)
      @connection = connection
      @confidential_parameters = confidential_parameters
    end

    def presented_parameters
      return nil if @connection.parameters.nil?

      Hash[@connection.parameters.map do |key, value|
        value = key.in?(@confidential_parameters) ? CONFIDENTIAL_PARAMETER_PLACEHOLDER : value
        [key, value]
      end]
    end

    def presented_token
      CONFIDENTIAL_PARAMETER_PLACEHOLDER
    end

    def singleton?
      @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
    end

    def errors
      []
    end

    def create
      update_redis_metadata if redis_metadata?
    end

    def destroy
      revoke_token
      remove_redis_metadata if redis_metadata?
    end

    def update
      update_redis_metadata if redis_metadata?
    end

    def complete?
      # By default, a saved connection should be complete and usable
      !@connection.new_record?
    end

    def prevalidate
      if @connection.connection_type.blank?
        @connection.connection_type = @connection.token.present? ?
          Carto::Connection::TYPE_OAUTH_SERVICE : Carto::Connection::TYPE_DB_CONNECTOR
      end

      if @connection.name.blank? && @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
        @connection.name = @connection.connector
      end
    end

    def adapt_parameters(connector_parameters); end

    private

    def revoke_token
      if @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
        @connection.get_service_datasource.revoke_token
      end
    rescue CartoDB::Datasources::TokenExpiredOrInvalidError => e
      message = "Error revoking token for service #{@connection.service}, user #{@connection.user&.username}"
      message += ": #{e}"
      Rails.logger.warn message
    end

    def redis_metadata?
      @connection.connection_type == Carto::Connection::TYPE_DB_CONNECTOR &&
         @connection.connector.in?(CLOUD_CONNECTORS)
    end

    def update_redis_metadata
      $users_metadata.hset(redis_key, @connection.id, serialized_connection)
    end

    def remove_redis_metadata
      $users_metadata.hdel redis_key, @connection.id
    end

    def redis_key
      "cloud_connections:#{@connection.user.username}:#{@connection.connector}"
    end

    def serialized_connection
      {
        connection_id: @connection.id,
        connection_type: @connection.connection_type,
        connector: @connection.connector,
        credentials: connection_credentials,
        options: connection_options
      }.to_json
    end

    def connection_credentials_keys
      CONFIDENTIAL_PARAMS + ['username']
    end

    def connection_credentials
      @connection.parameters&.slice(*connection_credentials_keys)
    end

    def connection_options
      @connection.parameters&.except(*connection_credentials_keys)
    end
  end
end
