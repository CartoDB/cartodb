module Carto
  module Subscribers
    class CentralUserCommands

      include ::LoggerHelper

      attr_reader :notifications_topic

      def initialize(notifications_topic)
        @notifications_topic = notifications_topic
      end

      def update_user(user_param)
        log_debug(message: 'Processing :update_user')
        user_id = user_param.delete('remote_user_id')

        return unless user_id.present? && user_param.any?

        # TODO: need to progress in the synchronizable concern
        # in particular, set_fields_from_central at least
        user = ::User.where(id: user_id).first

        # Copied from Superadmin::UsersController#update
        user.set_fields_from_central(user_param, :update)
        user.update_feature_flags(user_param[:feature_flags])
        user.regenerate_api_key(user_param[:api_key]) if user_param[:api_key].present?
        user.update_rate_limits(user_param[:rate_limit])
        user.update_gcloud_settings(user_param[:gcloud_settings])
        user.update_do_subscription(user_param[:do_subscription])
        user.save

        log_info(message: 'User updated', current_user: user)
      end

      def create_user(user_param)
        # NOTE copied from the superadmin users_controller.rb
        log_debug(message: 'Processing :create_user')
        user = ::User.new
        user.set_fields_from_central(user_param, :create)
        user.enabled = true

        if user_param[:rate_limit].present?
          user.rate_limit_id = Carto::RateLimitsHelper.create_rate_limits(user_param[:rate_limit]).id
        end
        if user.save
          user.reload
          if user.should_load_common_data?
            CartoDB::Visualization::CommonDataService.load_common_data(user, Superadmin::UsersController)
          end
          user.update_feature_flags(user_param[:feature_flags])
        end
        CartoGearsApi::Events::EventManager.instance.notify(
          CartoGearsApi::Events::UserCreationEvent.new(
            CartoGearsApi::Events::UserCreationEvent::CREATED_VIA_SUPERADMIN, user
          )
        )
        notifications_topic.publish(:user_created, {
                                      username: user.username,
                                      id: user.id
                                    })
        log_info(message: 'User created', current_user: user)
      end

      def delete_user(user_param)
        log_debug(message: 'Processing :delete_user')
        user = ::User.where(id: user_param[:id]).first
        user.set_force_destroy if user_param[:force] == 'true'
        user.destroy
        notifications_topic.publish(:user_deleted, {
                                      username: user.username
                                    })
        log_info(message: 'User deleted', current_user: user.username)
      rescue CartoDB::SharedEntitiesError
        notifications_topic.publish(:user_could_not_be_deleted, {
                                      username: user.username,
                                      reason: 'user has shared entities'
                                    })
        log_info(message: 'User could not be deleted because it has shared entities',
                 current_user: user.username)
      end

      private

      def log_context
        super.merge(class_name: self.class.name)
      end

    end
  end
end
