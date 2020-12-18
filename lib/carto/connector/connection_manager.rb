module Carto
  class ConnectionManager
    DB_PASSWORD_PLACEHOLDER = '********'.freeze
    OAUTH_TOKEN_PLACEHOLDER = '********'.freeze
    BQ_CONNECTOR = 'bq-v2'.freeze

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
      case connection.connection_type
      when Carto::Connection::TYPE_DB_CONNECTOR
        presented_connection[:parameters] = connection.parameters
        if presented_connection[:parameters].keys.include?('password')
          presented_connection[:parameters]['password'] = DB_PASSWORD_PLACEHOLDER
        end
      when Carto::Connection::TYPE_OAUTH_SERVICE
        presented_connection[:token] = OAUTH_TOKEN_PLACEHOLDER
        # presented_connection[:parameters] = connection.parameters if connection.parameters.present?
      end
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
      update_redis_metadata(connection)
      connection
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
      # conection.token.present? && @user.oauths.select(connection.service)&.get_service_datasource&.token_valid?
      conection.get_service_datasource&.token_valid?
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
      remove_redis_metadata(connection)
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

    def self.singleton_connector?(connector)
      (connector == BQ_CONNECTOR) || connector.in?(valid_oauth_services)
    end

    private

    def bigquery_redis_key
      "google:bq_settings:#{@user.username}"
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
