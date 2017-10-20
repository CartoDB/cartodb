require_dependency 'oauth/client'

module Carto
  module Google
    class Config
      GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth'.freeze
      GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v3/token'.freeze

      attr_reader :client

      def self.instance(csrf, controller, organization_name: nil, invitation_token: nil)
        Google::Config.new(csrf, controller, organization_name, invitation_token) if Cartodb.get_config(:oauth, 'google_plus', 'client_id').present?
      end

      def initialize(csrf, controller, organization_name, invitation_token)
        state = JSON.dump({
          csrf: csrf,
          organization_name: organization_name,
          invitation_token: invitation_token
        })

        @client = Carto::OAuth2Client.new(
          auth_url: GOOGLE_AUTH_URL,
          token_url: GOOGLE_TOKEN_URL,
          client_id: Cartodb.get_config(:oauth, 'google_plus', 'client_id'),
          client_secret: Cartodb.get_config(:oauth, 'google_plus', 'client_secret'),
          state: state,
          redirect_uri: base_callback_uri(controller),
          scopes: ['email', 'profile']
        )
      end

      def google_url
        client.authorize_url
      end

      private

      def base_callback_uri(controller)
        if Cartodb::Central.sync_data_with_cartodb_central?
          Cartodb::Central.new.host + '/google/oauth'
        else
          CartoDB.url(controller, 'google_oauth')
        end
      end
    end
  end
end
