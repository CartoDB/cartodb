module Carto
  module Api
    module Public
      class UsersController < Carto::Api::Public::ApplicationController
        ssl_required

        def me_public
          render(json: UserPublicPresenter.new(request_api_key.user).to_hash)
        end
      end
    end
  end
end
