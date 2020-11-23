module Carto
  class ConnectionManager
    DB_PASSWORD_PLACEHOLDER = '********'.freeze
    DB_TOKEN_PLACEHOLDER = '********'.freeze

    def initialize(user)
      @user = user
    end

    def list_connectors(connections: false, type: nil)
      types = Array(type)

      oauth_connectors = db_connectors = []

      if type.nil? || types.include?(Carto::Connection::TYPE_OAUTH_SERVICE)
        oauth_connectors += ConnectionManager.valid_oauth_services.map { |service|
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
        db_connectors += ConnectionManager.valid_db_connectors.map { |provider|
          is_enabled = Carto::Connector.provider_available?(provider, @user)
          connector = {
            types: [Carto::Connection::TYPE_DB_CONNECTOR],
            connector: provider,
            enabled: is_enabled,
            available: is_enabled
          }
          connector[:connections] = list_connections(connector: service) if connections
          connector
        }
      end

      # Unify connectors of dual type
      oauth_connectors.each do |oauth_connector|
        db_connector = db_connectors.find { |c| c[:connector] == oauth_connector[:connector] }
        if db_connector.present?
          db_connectors.delete db_connector
          oauth_connector[:types] += db_connectors[:types]
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
      connections = connections.where(type: type) if type.present
      connections = connections.where(connector: connector) if connector.present
      connections.map { |connection|
        # TODO: use presenter
        presented_connection = {
          id: connection.id,
          name: connection.name,
          connector: connection.connector,
          type: connection.type,
        }
        case type
        when Carto::Connection::TYPE_DB_CONNECTOR
          presented_connection[:parameters] = connection.parameters
          if presented_connection[:parameters].keys.include?('password')
            presented_connection[:parameters]['password'] = DB_PASSWORD_PLACEHOLDER
          end
        when Carto::Connection::TYPE_OAUTH_SERVICE
          presented_connection[:token] = OAUTH_TOKEN_PLACEHOLDER
        end
        # TODO: compute in_use
      }
    end

    def find_db_connection(provider, parameters)
      @user.db_connections.find { |connection|
        connection.type == Carto::Connection::TYPE_DB_CONNECTOR &&
        connection.connector == provider &&
         parameters == connection.parameters
      }
    end

    def find_oauth_connection(service)
      @user.connections.where(connector: service).first
    end

    def create_db_connection(name: nil, provider:, parameters:)
      existing_connection = find_db_connection(provider, parameters)
      return existing_connection if existing_connection.present?

      name ||= generate_unique_db_connection_name(provider) # FIXME: is it a good idea? note that the create may still fail if another connection is concurrently created
      @user.connections.create(name: name, connection: provider, parameters: parameters)
    end


    def oauth_connection_url(service) # returns auth_url, doesn't actually create connection
      DataImportsService.new.get_service_auth_url(@user, service)
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
    def fetch_valid_oauth_connection(service) # check for valid oauth_connection
      existing_connection = find_oauth_connection(service)
      return existing_connection if oauth_connection_valid?(existing_connection)
    end

    def create_oauth_connection_get_url(service:) # get_url_to_create_oauth_connection
      existing_connection = find_oauth_connection(service)
      existing_connection.destroy if existing_connection.present?
      oauth_connection_url(service)
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
      connection = fetch_connection!(id)
      case connection.type
      when Carto::Connection::TYPE_DB_CONNECTOR
        true
      when Carto::Connection::TYPE_OAUTH_SERVICE
        oauth_connection_valid?(connection.connector)
      end
    end

    def delete_connection(id)
      connection = fetch_connection!(id)
      connection.destroy
      @user.reload
    end

    def fetch_connection!(id)
      connection = @user.connections.where(id: id).first
      # TODO: use specific exception class
      raise "Connection #{id} not found" unless connection.present?
      connection
    end

    private

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

    def generate_unique_db_connection_name(provider)
      # ...
    end

  end
end
