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

        def self.authorize!(oauth_app_user, redirect_uri:, scopes:, state:, context:)
          auth_code = oauth_app_user.oauth_authorization_codes.create!(redirect_uri: redirect_uri, scopes: scopes)
          { code: auth_code.code, state: state }
        end
      end

      module TokenStrategy
        def self.build_redirect_uri(base_redirect_uri, parameters)
          redirect_uri = Addressable::URI.parse(base_redirect_uri)
          redirect_uri.fragment = URI.encode_www_form(parameters)

          redirect_uri.to_s
        end

        def self.authorize!(oauth_app_user, redirect_uri:, scopes:, state:, context:)
          access_token = oauth_app_user.oauth_access_tokens.create!(scopes: scopes)
          {
            access_token: access_token.api_key.token,
            token_type: 'Bearer',
            expires_in: access_token.expires_in,
            user_info_url: CartoDB.url(context, :api_v4_users_me, {}, oauth_app_user.user),
            state: state
          }
        end
      end
    end
  end
end
