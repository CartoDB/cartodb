module Carto
  module Api
    module Public
      class KuvizPresenter

        def initialize(user, kuviz, asset)
          @user = user
          @kuviz = kuviz
          @asset = asset
        end

        def to_hash
          base_rails_url = CartoDB.base_url(@user.username)
          {
            visualization: @kuviz.id,
            url: "#{base_rails_url}/kuviz/#{@kuviz.id}"
          }
        end
      end
    end
  end
end
