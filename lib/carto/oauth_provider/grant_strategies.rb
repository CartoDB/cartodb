module Carto
  module OauthProvider
    module GrantStrategies
      module AuthorizationCodeStrategy
        def self.authorize!(oauth_app, params)
          authorization_code = OauthAuthorizationCode.find_by_code!(params[:code])
          raise OauthProvider::Errors::InvalidGrant.new unless authorization_code.oauth_app == oauth_app

          redirect_uri = params[:redirect_uri]
          if (redirect_uri || authorization_code.redirect_uri) && redirect_uri != authorization_code.redirect_uri
            raise OauthProvider::Errors::InvalidRequest.new('The redirect_uri must match the authorization request')
          end

          authorization_code.exchange!
        rescue ActiveRecord::RecordNotFound
          raise OauthProvider::Errors::InvalidGrant.new
        end

        def self.required_params
          ['code']
        end
      end

      module RefreshTokenStrategy
        def self.authorize!(oauth_app, params)
          refresh_token = OauthRefreshToken.find_by_token!(params[:refresh_token])
          raise OauthProvider::Errors::InvalidGrant.new unless refresh_token.oauth_app == oauth_app

          if params[:scope]
            refresh_token.exchange!(requested_scopes: params[:scope].split(' '))
          else
            refresh_token.exchange!
          end
        rescue ActiveRecord::RecordNotFound
          raise OauthProvider::Errors::InvalidGrant.new
        end

        def self.required_params
          ['refresh_token']
        end
      end
    end
  end
end
