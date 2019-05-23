module Carto
  module Api
    module Public
      class KuvizPresenter

        def initialize(context, user, kuviz, asset)
          @context = context
          @user = user
          @kuviz = kuviz
          @asset = asset
        end

        def to_hash
          {
            visualization: @kuviz.id,
            url: CartoDB.url(@context, 'kuviz_show',
                             params: { id: @kuviz.id },
                             user: @user)
          }
        end
      end
    end
  end
end
