require_dependency 'carto/oauth/config'

module Carto
  module Oauth
    module Google
      class Config < Carto::Oauth::Config
        def self.config
          Cartodb.get_config(:oauth, 'google_plus') || {}
        end

        def auth_url
          'https://accounts.google.com/o/oauth2/auth'.freeze
        end

        def token_url
          'https://www.googleapis.com/oauth2/v3/token'.freeze
        end

        def scopes
          ['email', 'profile'].freeze
        end

        def button_template
          'google_plus/google_plus_button'
        end

        def valid_method_for?(user)
          user.organization.nil? || auth_enabled?(user.organization)
        end

        def auth_enabled?(organization)
          organization.auth_google_enabled
        end
      end
    end
  end
end
