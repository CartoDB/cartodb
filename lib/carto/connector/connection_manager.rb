
require 'carto/gcloud/spatial_extension_setup'

require_relative 'parameters'

module Carto
  class ConnectionManager
    CONFIDENTIAL_PARAMETER_PLACEHOLDER = '********'.freeze
    CONFIDENTIAL_PARAMS = %w(password)
    BQ_CONNECTOR = 'bigquery'.freeze
    BQ_NON_CONNECTOR_PARAMETERS = ['email']
    BQ_CONFIDENTIAL_PARAMS = %w(service_account refresh_token access_token)

    def initialize(user)
      @user = user
      @user = Carto::User.find(@user.id) unless @user.kind_of?(Carto::User)
    end

    def list_connectors(connections: false, type: nil)
      types = Array(type)

      oauth_connectors = db_connectors = []

      if type.nil? || types.include?(Carto::Connection::TYPE_OAUTH_SERVICE)
        oauth_connectors = Carto::ConnectionManager.valid_oauth_services.map { |service|
          # TODO: check enabled for @user
          is_enabled = true
          # TODO: use presenter
          connector = {
            types: [Carto::Connection::TYPE_OAUTH_SERVICE],
            connector: service,
            enabled: is_enabled,
            available: !@user.connections.exists?(connector: service)
          }
          connector[:connections] = list_connections(connector: service) if connections
          connector
        }
      end

      if type.nil? || types.include?(Carto::Connection::TYPE_DB_CONNECTOR)
        db_connectors = Carto::ConnectionManager.valid_db_connectors.map { |provider|
          is_enabled = Carto::Connector.provider_available?(provider, @user)
          connector = {
            types: [Carto::Connection::TYPE_DB_CONNECTOR],
            connector: provider,
            enabled: is_enabled,
            available: is_enabled
          }
          connector[:connections] = list_connections(connector: provider) if connections
          connector
        }
      end

      # Unify connectors of dual type
      oauth_connectors.each do |oauth_connector|
        db_connector = db_connectors.find { |c| c[:connector] == oauth_connector[:connector] }
        if db_connector.present?
          db_connectors.delete db_connector
          oauth_connector[:types] += db_connector[:types]
          # assume enabled is same for both
          oauth_connector[:available] &&= db_connector[:available]
          if connections
            oauth_connector[:connections] += db_connector[:connections]
          end
        end
      end

      oauth_connectors + db_connectors
    end

    def list_connections(type: nil, connector: nil)
      connections = @user.connections
      connections = connections.where(connection_type: type) if type.present?
      connections = connections.where(connector: connector) if connector.present?
      connections.map { |connection| present_connection(connection) }
    end

    def show_connection(id)
      present_connection @user.connections.find(id)
    end

    def present_connection(connection)
      presented_connection = {
        id: connection.id,
        name: connection.name,
        connector: connection.connector,
        type: connection.connection_type,
      }
      presented_connection[:parameters] = presented_parameters(connection) if connection.parameters.present?
      presented_connection[:token] = presented_token(connection) if connection.token.present?
      # TODO: compute in_use
      presented_connection
  end

    def find_db_connection(provider, parameters)
      @user.db_connections.find { |connection|
        connection.connector == provider &&
         parameters == connection.parameters
      }
    end

    def find_oauth_connection(service)
      @user.oauth_connections.where(connector: service).first
    end

    def create_db_connection(name:, provider:, parameters:)
      check_db_provider!(provider)
      connection = @user.connections.create!(name: name, connector: provider, parameters: parameters)
      create_connection_hook(connection)
      connection
    end

    def find_or_create_db_connection(provider, parameters)
      find_db_connection(provider, parameters) ||
      create_db_connection(
        name: generate_connection_name(provider),
        provider: provider,
        parameters: parameters
      )
    end

    # create Oauth connection logic
    #    connection = nil
    #    loop do
    #      # First check if valid connection already exists
    #      connection = connection_manager.fetch_valid_oauth_connection(service)
    #      break if connection
    #      # Give user opportunity to cancel, since next step will remove any existing connection
    #      break if user_cancels_connection()
    #      # let the user authorize our app; existing connection will be dismissed
    #      open_authorization_window(connection_manager.create_oauth_connection_get_url(service))
    #    end
    #    if connection
    #      # connection of dual type (bigquery) we must additionally require parameters from the user and assign them:
    #      connection = assign_db_parameters(service, parameters)
    #    end
    def fetch_valid_oauth_connection(service) # check for valid oauth_connection
      existing_connection = find_oauth_connection(service)
      return existing_connection if oauth_connection_valid?(existing_connection)
    end

    def create_oauth_connection_get_url(service:) # get_url_to_create_oauth_connection
      check_oauth_service!(service)
      existing_connection = find_oauth_connection(service)
      delete_connection(existing_connection.id) if existing_connection.present?
      oauth_connection_url(service)
    end

    # for dual connection only (BigQuery): after fetching a valid oauth connection,
    # parameters should be assigned, which will trigger the final validation
    # this may not be needed: API could perform a regular update
    def assign_db_parameters(service:, parameters:)
      connection = find_oauth_connection(service)
      raise "Connection not found for service #{service}" unless connection.present?

      connection.update! parameters: parameters
      connection
    end

    # def oauth_connection_completed?(service)
    #   connection = find_oauth_connection(service)
    #   connection.present? && connection.token.present?
    # end

    def oauth_connection_valid?(connection)
      # connection.token.present? && @user.oauths.select(connection.service)&.get_service_datasource&.token_valid?
      connection.get_service_datasource&.token_valid?
    end

    def connection_ready?(id)
      connection = fetch_connection(id)
      case connection.connection_type
      when Carto::Connection::TYPE_DB_CONNECTOR
        true
      when Carto::Connection::TYPE_OAUTH_SERVICE
        oauth_connection_valid?(connection.connector)
      end
    end

    def delete_connection(id)
      connection = fetch_connection(id)
      revoke_token(connection)
      connection.destroy!
      @user.reload
      remove_connection_hook(connection)
    end

    def fetch_connection(id)
      @user.connections.find(id)
    end

    def update_db_connection(id:, parameters: nil, name: nil)
      connection = fetch_connection(id)
      new_attributes = {}
      new_attributes[:parameters] = connection.parameters.merge(parameters) if parameters.present?
      new_attributes[:name] = name if name.present?
      connection.update!(new_attributes) if new_attributes.present?
      update_redis_metadata(connection)
    end

    # This adapts parameters to be passed to a db connector, optionally registering a new connection.
    # Two parameter sets are returned, the first intended to be stored (in a DataImport or Synchronization),
    # which references if possible the connection parameter through a `connection_id` paramter.
    # The second result are the parameters to be passed to a db connector, where connection parameters are
    # included in a `connection` parameter
    #
    # The connection can be provided by any of theas means:
    # * through the separate `connection` argument
    # * referenced by a `connection_id` parameter in `parameters`
    # * passing the connection parameters in `parameters[:connection]` (for backwards compatibility with Import API v1)
    #
    # If the `register` argument is true, and connection parameters are embedded in the `parameters` argument,
    # a new connection will be created if an existing one is not found with the proper parameters.
    # If the `register` argument is not true and connections parameters are provided embedded in `parameters`,
    # then they will be retained as such in the resulting input parameters.
    def adapt_db_connector_parameters(parameters:, connection: nil, register: false)
      connector_parameters = Carto::Connector::Parameters.new(parameters)
      provider = connector_parameters[:provider]
      connection_parameters = connector_parameters[:connection]
      unless connection.present?
        connection_id = connector_parameters[:connection_id]
        if connection_id.present?
          connection = fetch_connection(connection_id)
        elsif connection_parameters.present? && register
          connection = find_or_create_db_connection(provider, connection_parameters)
        end
      end

      input_parameters = connector_parameters.dup

      if connection.present?
        if provider.present?
          raise "Invalid connection" if provider != connection.connector
        else
          connector_parameters.merge! provider: connection.connector
        end
        connection_parameters = filtered_connection_parameters(connection)

        # This was to support hybrid OAuth connections that also have parameters are use connectors (BigQuery)
        # but they're currently not supported
        # connection_parameters = connection_parameters.merge(refresh_token: connection.token) if connection.token.present?

        connector_parameters.merge! connection: connection_parameters
        connector_parameters.delete :connection_id
        input_parameters.merge! connection_id: connection.id
        input_parameters.delete :connection
      end

      if legacy_oauth_db_connection?(connector_parameters)
        connection_parameters = connector_parameters[:connection] || {}
        connection_parameters[:refresh_token] = @user.oauths&.select(connection.connector)&.token
      end

      [input_parameters, connector_parameters]
    end


    def legacy_oauth_db_connection?(connector_parameters)
      return false unless connector_parameters[:provider] == 'bigquery'

      credentials = [:service_token, :refresh_token, :access_token]
      connection_parameters = (connector_parameters[:connection] || {}).keys
      (credentials & connection_parameters).empty?
    end

    def self.singleton_connector?(connector, connection_type)
      # All OAuth connections are singleton (per user/connector/connection_type)
      return true if connection_type == Carto::Connection::TYPE_OAUTH_SERVICE

      # BigQuery as db connection (with service account) is singleton for the time being
      return connector == BQ_CONNECTOR
    end

    def self.validate_connector(connector, connection_type, connection_parameters)
      errors = []
      case connection_type
      when Carto::Connection::TYPE_OAUTH_SERVICE
        errors << "Not a valid OAuth connector: #{connector}" unless connector.in?(valid_oauth_services)
      when Carto::Connection::TYPE_DB_CONNECTOR
        if !connector.in?(valid_db_connectors)
          errors << "Not a valid DB connector: #{connector}"
        elsif connector == BQ_CONNECTOR
          errors << "Parameter refresh_token not supported for db-connection; use OAuth connection instead" if connection_parameters['refresh_token'].present?
          errors << "Parameter access_token not supported through connections; use import API" if connection_parameters['access_token'].present?
        end
      end
      errors
    end

    private

    def presented_parameters(connection)
      confidential_parameters = connection.connector == BQ_CONNECTOR ? BQ_CONFIDENTIAL_PARAMS : CONFIDENTIAL_PARAMS
      connection.parameters.map do |key, value|
        [key, key.in?(confidential_parameters) ? CONFIDENTIAL_PARAMETER_PLACEHOLDER : value]
      end
    end

    def presented_token(connection)
      CONFIDENTIAL_PARAMETER_PLACEHOLDER
    end

    def generate_connection_name(provider)
      # FIXME: this could produce name collisions
      n = @user.db_connections.where(connector: provider).count
      n > 0 ? "provider_#{n+1}" : provider
    end

    def bigquery_redis_key
      "google:bq_settings:#{@user.username}"
    end

    def filtered_connection_parameters(connection)
      # TODO: move to per-connector classes
      parameters = connection.parameters
      parameters = parameters.except(*BQ_NON_CONNECTOR_PARAMETERS) if connection.connector == BQ_CONNECTOR
      parameters
    end

    def create_connection_hook(connection)
      # TODO: move to per-connector classes
      update_redis_metadata(connection)
      create_spatial_extension_setup(connection)
    end

    def remove_connection_hook(connection)
      # TODO: move to per-connector classes
      remove_redis_metadata(connection)
      remove_spatial_extension_setup(connection)
    end

    def create_spatial_extension_setup(connection)
      if connection.connector == BQ_CONNECTOR && connection.parameters['email'].present?
        role = Cartodb.config[:spatial_extension]['role']
        datasets = Cartodb.config[:spatial_extension]['datasets']
        return unless datasets.present?

        spatial_extension_setup = Carto::Gcloud::SpatialExtensionSetup.new(role: role, datasets: datasets)
        spatial_extension_setup.create(connection)
      end
    end

    def remove_spatial_extension_setup(connection)
      if connection.connector == BQ_CONNECTOR && connection.parameters['email'].present?
        role = Cartodb.config[:spatial_extension]['role']
        datasets = Cartodb.config[:spatial_extension]['datasets']
        return unless datasets.present?

        spatial_extension_setup = Carto::Gcloud::SpatialExtensionSetup.new(role: role, datasets: datasets)
        spatial_extension_setup.remove(connection)
      end
    end

    def update_redis_metadata(connection)
      if connection.connector == BQ_CONNECTOR && connection.parameters['service_account'].present?
        $users_metadata.hset bigquery_redis_key, 'service_account', connection.parameters['service_account']
      end
    end

    def remove_redis_metadata(connection)
      if connection.connector == BQ_CONNECTOR
        $users_metadata.del bigquery_redis_key
      end
    end

    def revoke_token(connection)
      if connection.connection_type == Carto::Connection::TYPE_OAUTH_SERVICE
        connection.get_service_datasource.revoke_token
      end
    rescue CartoDB::Datasources::TokenExpiredOrInvalidError
    end

    def oauth_connection_url(service) # returns auth_url, doesn't actually create connection
      DataImportsService.new.get_service_auth_url(@user, service)
    end

    def self.valid_oauth_services
      CartoDB::Datasources::DatasourcesFactory.get_all_oauth_datasources.select { |service|
        # FIXME: this includes twitter...
        # begin
        #   config, _ = CartoDB::Datasources::DatasourcesFactory.get_config(service)
        #   config.present?
        # rescue MissingConfigurationError
        #   false
        # end
        Cartodb.config[:oauth][service].present?
      }
    end

    def self.valid_db_connectors
      Carto::Connector.providers.keys
    end

    def check_oauth_service!(service)
      # TODO: check also that is enabled for @user
      raise "Invalid OAuth service #{service}" unless service.in?(Carto::ConnectionManager.valid_oauth_services)
    end

    def check_db_provider!(provider)
      # TODO: check also that is enabled for @user
      raise "Invalid DB provider #{provider}" unless provider.in?(Carto::ConnectionManager.valid_db_connectors)
    end
  end
end
