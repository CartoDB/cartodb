module Carto
  class UserMultifactorAuthUpdateService

    def initialize(user_id:)
      @user_id = user_id
    end

    def update(enabled:)
      if enabled
        Carto::UserMultifactorAuth.create(user_id: @user_id, type: Carto::UserMultifactorAuth::TYPE_TOTP)
      else
        Carto::UserMultifactorAuth.where(user_id: @user_id).each(&:destroy)
      end
    end

  end
end
