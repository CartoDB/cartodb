module Carto
  class UserMultifactorAuthUpdateService

    def initialize(user_id:)
      @user_id = user_id
    end

    def update(enabled:, type: Carto::UserMultifactorAuth::TYPE_TOTP)
      enabled ? create_user_multifactor_auth(type) : destroy_user_multifactor_auth(type)
    end

    def exists?(type: Carto::UserMultifactorAuth::TYPE_TOTP)
      user_multifactor_auth(type).present?
    end

    private

    def create_user_multifactor_auth(type)
      Carto::UserMultifactorAuth.create!(user_id: @user_id, type: type) unless exists?
    end

    def destroy_user_multifactor_auth(type)
      user_multifactor_auth(type).each(&:destroy!)
    end

    def user_multifactor_auth(type)
      Carto::UserMultifactorAuth.where(user_id: @user_id, type: type)
    end

  end
end
