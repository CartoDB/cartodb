module Carto
  module Api
    module Public
      class AppPresenter

        def initialize(context, user, app)
          @context = context
          @user = user
          @app = app
        end

        def to_hash
          {
            id: @app.id,
            name: @app.name,
            privacy: @app.privacy,
            created_at: @app.created_at,
            updated_at: @app.updated_at,
            url: CartoDB.url(@context, 'app_show',
                             params: { id: @app.id },
                             user: @user)
          }
        end
      end
    end
  end
end
