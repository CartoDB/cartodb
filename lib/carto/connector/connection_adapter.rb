module Carto
  # ConnectionAdapter is a base class to provide additional connector-specific functionality to Connections
  class ConnectionAdapter
    CONFIDENTIAL_PARAMETER_PLACEHOLDER = '********'.freeze
    CONFIDENTIAL_PARAMS = %w(password).freeze

    def initialize(connection, confidential_parameters: CONFIDENTIAL_PARAMS)
      @connection = connection
      @confidential_parameters = confidential_parameters
    end

    def presented_parameters
      Hash[@connection.parameters.map do |key, value|
        value = key.in?(@confidential_parameters) ? CONFIDENTIAL_PARAMETER_PLACEHOLDER : value
        [key, value]
      end]
    end

    def presented_token
      CONFIDENTIAL_PARAMETER_PLACEHOLDER
    end

    def filtered_connection_parameters(connection)
      @connection.parameters
    end

    def singleton?
      @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
    end

    def errors
      []
    end

    def create
    end

    def destroy
      revoke_token
    end

    def update
    end

    private

    def revoke_token
      if @connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
        @connection.get_service_datasource.revoke_token
      end
    rescue CartoDB::Datasources::TokenExpiredOrInvalidError
    end
  end
end