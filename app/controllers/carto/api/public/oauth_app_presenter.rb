module Carto
  module Api
    module Public
      class OauthAppPresenter

        PRIVATE_ATTRIBUTES = %i(
          id user_id name created_at updated_at client_id client_secret redirect_uris icon_url restricted
        ).freeze

        PUBLIC_ATTRIBUTES = %i(id name created_at updated_at).freeze

        def initialize(oauth_app)
          @oauth_app = oauth_app
        end

        def to_hash(public: false)
          public ? to_public_hash : to_private_hash
        end

        private

        def to_private_hash
          @oauth_app.slice(*PRIVATE_ATTRIBUTES).merge(username: @oauth_app.user.username)
        end

        def to_public_hash
          @oauth_app.slice(*PUBLIC_ATTRIBUTES)
        end

      end
    end
  end
end
