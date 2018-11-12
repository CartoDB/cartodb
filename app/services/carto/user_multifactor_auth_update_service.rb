module Carto
  class UserMultifactorAuthUpdateService

    def initialize(user_id:)
      @user_id = user_id
    end

    def update(enabled:, type: Carto::UserMultifactorAuth::TYPE_TOTP)
      if enabled
        create_user_multifactor_auth(type)
      else
        Carto::UserMultifactorAuth.where(user_id: @user_id).each(&:destroy!)
      end
    end

    private 

    def create_user_multifactor_auth(type)
      unless Carto::UserMultifactorAuth.where(user_id: @user_id, type: type).present?
        Carto::UserMultifactorAuth.create!(user_id: @user_id, type: type)
      end
    end

  end
end
