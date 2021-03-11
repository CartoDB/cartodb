module Carto
  class UserUpdater

    def initialize(user)
      # TODO: this needs to be a ::User for this to work. We need to
      # progress in the synchronizable concern, in particular the
      # method set_fields_from_central at least
      @user = user.sequel_user
    end

    def update!(user_param)
      # Copied from Superadmin::UsersController#update
      @user.set_fields_from_central(user_param, :update)
      @user.update_feature_flags(user_param[:feature_flags])
      @user.regenerate_api_key(user_param[:api_key]) if user_param[:api_key].present?
      @user.update_rate_limits(user_param[:rate_limit])
      @user.update_do_subscription(user_param[:do_subscription])
      @user.save!
    end

  end
end
