module Carto
  module OauthProvider
    module Strategies
      module AuthorizationCodeStrategy
        def self.authorize!(oauth_app, params)
          authorization_code = OauthAuthorizationCode.find_by_code!(params[:code])
          raise OauthProvider::Errors::InvalidGrant.new unless authorization_code.oauth_app_user.oauth_app == oauth_app

          redirect_uri = params[:redirect_uri]
          if (redirect_uri || authorization_code.redirect_uri) && redirect_uri != authorization_code.redirect_uri
            raise OauthProvider::Errors::InvalidRequest.new('The redirect_uri must match the authorization request')
          end

          authorization_code.exchange!
        rescue ActiveRecord::RecordNotFound
          raise OauthProvider::Errors::InvalidGrant.new
        end
      end
    end
  end
end
