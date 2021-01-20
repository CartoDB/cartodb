module Carto
  class BqClientFactory
    DO_CONNECTOR_PROVIDER = 'bigquery'.freeze

    def self.get_for_user(user, oauth: false)
      if oauth
        connection = user.oauth_connections.where(connector: DO_CONNECTOR_PROVIDER).first
      else
        connection = user.db_connections.where(connector: DO_CONNECTOR_PROVIDER).first
      end
      raise "BQ connection 0cConfiguration not for user #{user.username}" unless connection.present?

      connector = Carto::Connector.new(
        parameters: { connection_id: connection.id, bq_client: true },
        user: user
      )
      get_client_from_connector(connector)
    end

    # # This could be handy to use the client as a general one unrelated to connections,
    # # but would require Carto::Connector to be instantiated without a user.
    # def self.get(billing_project:, service_account: nil, access_token: nil, refresh_token: nil)
    #   num_creds = [service_account, access_token, refresh_token].compact.size
    #   if num_creds == 0
    #     raise "No credentials provider; Either a service account key, an access token or a refress token is needed"
    #   elsif num_creds > 1
    #     raise "Multiple credentials provided"
    #   end
    #   connection = {
    #     billing_project: billing_project,
    #     service_account: service_account,
    #     access_token: access_token,
    #     refresh_token: refresh_token
    #   }
    #   connector = Carto::Connector.new(
    #     parameters: { provider: DO_CONNECTOR_PROVIDER, connection: connection, bq_client: true }
    #   )
    #   get_client_from_connector(connector)
    # end

    private

    def self.get_client_from_connector(connector)
      connector.get_service(:bq_client)
    rescue Carto::Connector::InvalidParametersError
      # Support for BQ Client
      nil
    end
  end
end
