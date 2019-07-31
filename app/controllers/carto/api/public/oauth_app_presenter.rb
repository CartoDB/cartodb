module Carto
  module Api
    module Public
      class OauthAppPresenter

        PRIVATE_ATTRIBUTES = %i(
          id user_id name created_at updated_at client_id client_secret
          redirect_uris icon_url restricted description website_url
        ).freeze

        PUBLIC_ATTRIBUTES = %i(id name created_at updated_at description website_url icon_url).freeze

        def initialize(oauth_app, user: nil)
          @oauth_app = oauth_app
          @user = user
        end

        def to_hash(private_data: false)
          private_data ? to_private_hash : to_public_hash
        end

        private

        def to_private_hash
          @oauth_app.slice(*PRIVATE_ATTRIBUTES).merge(username: @oauth_app.user.username)
        end

        def to_public_hash
          oauth_app_user = @oauth_app.oauth_app_users.where(user: @user).first
          scopes = Carto::OauthProvider::Scopes.scopes_by_category(oauth_app_user&.all_scopes)
          @oauth_app.slice(*PUBLIC_ATTRIBUTES).merge(scopes: scopes)
        end

      end
    end
  end
end
