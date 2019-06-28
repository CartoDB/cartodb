module Carto
  module Api
    module Public
      class OauthAppPresenter

        EXPOSED_ATTRIBUTES = %i(
          id user_id name created_at updated_at client_id client_secret redirect_uris icon_url restricted
        ).freeze

        def initialize(oauth_app)
          @oauth_app = oauth_app
        end

        def to_hash
          @oauth_app.slice(*EXPOSED_ATTRIBUTES).merge(username: @oauth_app.user.username)
        end

      end
    end
  end
end
