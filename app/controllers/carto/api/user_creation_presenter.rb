module Carto
  module Api
    class UserCreationPresenter

      def initialize(user_creation)
        @user_creation = user_creation
      end

      def to_poro
        {
          id: @user_creation.id,
          username: @user_creation.username,
          email: @user_creation.email,
          organization_id: @user_creation.organization_id,
          google_sign_in: @user_creation.google_sign_in,
          state: @user_creation.state,
          created_at: @user_creation.created_at,
          updated_at: @user_creation.updated_at
        }
      end

    end
  end
end
