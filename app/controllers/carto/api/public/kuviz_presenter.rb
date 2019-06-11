module Carto
  module Api
    module Public
      class KuvizPresenter

        def initialize(context, user, kuviz)
          @context = context
          @user = user
          @kuviz = kuviz
        end

        def to_hash
          {
            id: @kuviz.id,
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
