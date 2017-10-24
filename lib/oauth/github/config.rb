require_dependency 'oauth/config'

module Oauth
  module Github
    class Config < Oauth::Config
      def self.config
        Cartodb.get_config(:oauth, 'github') || {}
      end

      def auth_url
        'https://github.com/login/oauth/authorize'.freeze
      end

      def token_url
        'https://github.com/login/oauth/access_token'.freeze
      end

      def scopes
        ['user:email'].freeze
      end

      def button_template
        'github/github_button'
      end

      def valid_method_for?(user)
        user.organization.nil? || user.organization.auth_google_enabled
      end
    end
  end
end
