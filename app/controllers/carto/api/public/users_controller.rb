module Carto
  module Api
    module Public
      class UsersController < Carto::Api::Public::ApplicationController
        ssl_required

        def me_public
          presentation = UserPublicPresenter.new(request_api_key.user).to_hash

          if request_api_key.user_data.try(:include?, 'profile')
            presentation.deep_merge!(UserPublicProfilePresenter.new(request_api_key.user).to_hash)
          end

          render(json: presentation)
        end
      end
    end
  end
end
