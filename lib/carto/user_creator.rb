module Carto
  class UserCreator

    # NOTE: copied from the superadmin users_controller.rb
    def create!(params)
      user = ::User.new

      user.set_fields_from_central(params, :create)
      user.enabled = true

      if params[:rate_limit].present?
        user.rate_limit_id = Carto::RateLimitsHelper.create_rate_limits(params[:rate_limit]).id
      end
      if user.save!
        user.reload
        CartoDB::Visualization::CommonDataService.load_common_data(user, nil) if user.should_load_common_data?
        user.update_feature_flags(params[:feature_flags])
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
