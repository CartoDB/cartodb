module Carto
  module OauthProvider
    module ResponseStrategies
      module CodeStrategy
        def self.build_redirect_uri(base_redirect_uri, parameters)
          redirect_uri = Addressable::URI.parse(base_redirect_uri)
          query = redirect_uri.query_values || {}
          redirect_uri.query_values = query.merge(parameters)

          redirect_uri.to_s
        end

        def self.authorize!(oauth_app_user, redirect_uri:, scopes:, state:)
          auth_code = oauth_app_user.oauth_authorization_codes.create!(redirect_uri: redirect_uri, scopes: scopes)
          { code: auth_code.code, state: state }
        end
      end
    end
  end
end
