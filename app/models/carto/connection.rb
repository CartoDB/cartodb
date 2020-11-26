
module Carto
  class Connection < ActiveRecord::Base
    TYPE_OAUTH_SERVICE = 'oauth-service'.freeze
    TYPE_DB_CONNECTOR = 'db-connector'.freeze

    # id, user_id, name, connection_type, parameters, connector, token

    # connection_type == 'db-connector'
    #     provider = connector
    #     parameters
    # connection_type == 'oauth-service'
    #   service = connector
    #   token / synchronization_oauth
    # connection_type == 'url-service'
    #   service
    #   parameters (for service='arcgis' parameters: { base_url: ...})

    # there might be a connection_type='db-connector' (future service account support) with provider = 'bigquery'
    # or a connection_type='oauth-service' record  with service = 'bigquery'
    # (note that only token used in the latter case; no parameters as the billing project has been removed from the connection)
    belongs_to :user, class_name: 'Carto::User', inverse_of: :connections

    scope :oauth_connections, -> { where(connection_type: TYPE_OAUTH_SERVICE) }
    scope :db_connections, -> { where(connection_type: TYPE_DB_CONNECTOR) }

    validates :name, uniqueness: { scope: :user_id }

    def get_service_datasource
      raise "Invalid connection type (#{connection_type}) to get service datasource" unless connection_type == TYPE_OAUTH_SERVICE

      datasource = CartoDB::Datasources::DatasourcesFactory.get_datasource(connector, user, {
        http_timeout: ::DataImport.http_timeout_for(user)
      })
      datasource.token = token unless datasource.nil?
      datasource
    end

    def service
      raise "service not available for connection of type #{connection_type}" unless connection_type == TYPE_OAUTH_SERVICE
      connector
    end

    def provider
      raise "provider not available for connection of type #{connection_type}"  unless connection_type == TYPE_DB_CONNECTOR
      connector
    end

    before_validation :set_type
    before_validation :set_name
    # before_validation :set_parameters

    private

    def set_type
      return if connection_type.present?

      if token.present?
        self.connection_type = TYPE_OAUTH_SERVICE
      else
        self.connection_type = TYPE_DB_CONNECTOR
      end
    end

    def set_name
      return if name.present?

      if connection_type == TYPE_OAUTH_SERVICE
        self.name = connector
      end
    end

    def set_parameters
      return if parameters.present?

      if connection_type == TYPE_OAUTH_SERVICE
        self.parameters = { refresh_token: token }
      end
    end
  end
end
