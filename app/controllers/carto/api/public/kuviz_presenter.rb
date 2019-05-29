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
            name: @kuviz.name,
            privacy: @kuviz.privacy,
            created_at: @kuviz.created_at,
            updated_at: @kuviz.updated_at,
            url: CartoDB.url(@context, 'kuviz_show',
                             params: { id: @kuviz.id },
                             user: @user)
          }
        end
      end
    end
  end
end
