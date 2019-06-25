module Carto
  module Api
    module Public
      class OauthAppPresenter

        def initialize(oauth_app)
          @oauth_app = oauth_app
        end

        def to_poro
          @oauth_app.attributes.merge(username: @oauth_app.user.username)
        end

      end
    end
  end
end
