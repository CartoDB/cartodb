require_dependency 'carto/oauth/client'

module Carto
  module Oauth
    class Config
      attr_reader :client

      def self.api_class
        parent.const_get(:Api)
      end

      def self.instance(csrf, base_callback_url, invitation_token: nil, organization_name: nil)
        if config['client_id'].present?
          if Cartodb::Central.sync_data_with_cartodb_central?
            base_callback_url = Cartodb::Central.new.host + URI.parse(base_callback_url).path
          end
          new(csrf, base_callback_url, invitation_token, organization_name)
        end
      end

      def initialize(csrf, base_callback_url, invitation_token, organization_name)
        state = JSON.dump(
          csrf: csrf,
          invitation_token: invitation_token,
          organization_name: organization_name
        )

        @client = Carto::Oauth::Client.new(
          auth_url: auth_url,
          token_url: token_url,
          client_id: config['client_id'],
          client_secret: config['client_secret'],
          state: state,
          redirect_uri: base_callback_url,
          scopes: scopes
        )
      end

      def redirect_url
        client.authorize_url
      end

      def valid_method_for?(user)
        user.organization.nil? || auth_enabled?(user.organization)
      end

      def auth_enabled?(organization)
        raise 'Subclass must override auth_enabled?'
      end

      def self.config
        raise 'Subclass must override config'
      end
      private_class_method :config

      private

      def config
        self.class.config
      end

      def auth_url
        raise 'Subclass must override auth_url'
      end

      def token_url
        raise 'Subclass must override token_url'
      end

      def scopes
        raise 'Subclass must override scopes'
      end

      def valid?(_user)
        raise 'Subclass must override valid?'
      end

      # View-related configuration
      def button_template
        raise 'Subclass must override button_template'
      end
    end
  end
end
