module Carto
  class UserCreator
    # NOTE copied from the superadmin users_controller.rb
    def create(user_param)
      user = ::User.new

      user_param = params[:user]
      user.set_fields_from_central(user_param, :create)
      user.enabled = true

      if user_param[:rate_limit].present?
        user.rate_limit_id = Carto::RateLimitsHelper.create_rate_limits(user_param[:rate_limit]).id
      end
      if user.save
        user.reload
        CartoDB::Visualization::CommonDataService.load_common_data(user, self) if user.should_load_common_data?
        user.update_feature_flags(user_param[:feature_flags])
      end
      CartoGearsApi::Events::EventManager.instance.notify(
        CartoGearsApi::Events::UserCreationEvent.new(
          CartoGearsApi::Events::UserCreationEvent::CREATED_VIA_SUPERADMIN, user
        )
      )

      user
    end
  end
end
