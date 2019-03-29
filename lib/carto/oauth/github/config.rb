require_dependency 'carto/oauth/config'

module Carto
  module Oauth
    module Github
      class Config < Carto::Oauth::Config
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

        def auth_enabled?(organization)
          organization.auth_github_enabled
        end
      end
    end
  end
end
