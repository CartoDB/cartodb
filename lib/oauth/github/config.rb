require_dependency 'oauth/client'

module Carto
  module Github
    class Config
      GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'.freeze
      GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'.freeze

      attr_reader :client

      def self.instance(csrf, controller, organization_name: nil, invitation_token: nil)
        if Cartodb.get_config(:oauth, 'github', 'client_id').present?
          Github::Config.new(csrf, controller, organization_name, invitation_token)
        end
      end

      def initialize(csrf, controller, organization_name, invitation_token)
        state = JSON.dump(
          csrf: csrf,
          organization_name: organization_name,
          invitation_token: invitation_token
        )

        @client = Carto::OAuth2Client.new(
          auth_url: GITHUB_AUTH_URL,
          token_url: GITHUB_TOKEN_URL,
          client_id: Cartodb.get_config(:oauth, 'github', 'client_id'),
          client_secret: Cartodb.get_config(:oauth, 'github', 'client_secret'),
          state: state,
          redirect_uri: base_callback_uri(controller),
          scopes: ['user:email']
        )
      end

      def github_url
        client.authorize_url
      end

      private

      def base_callback_uri(controller)
        if Cartodb::Central.sync_data_with_cartodb_central?
          Cartodb::Central.new.host + '/github'
        else
          CartoDB.url(controller, 'github')
        end
      end
    end
  end
end
