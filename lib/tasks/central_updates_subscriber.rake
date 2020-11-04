module RateLimitsHelper

  def self.create_rate_limits(rate_limit_attributes)
    rate_limit = Carto::RateLimit.from_api_attributes(rate_limit_attributes)
    rate_limit.save!
    rate_limit
  end

end

class CentralUserCommands

  attr_reader :notifications_topic

  def initialize(notifications_topic)
    @notifications_topic = notifications_topic
  end

  def update_user(user_param)
    puts 'Processing :update_user'
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

    puts "User #{user.username} updated"
  end

  def create_user(user_param)
    # NOTE copied from the superadmin users_controller.rb
    puts 'Processing :create_user'
    user = ::User.new
    user.set_fields_from_central(user_param, :create)
    user.enabled = true

    if user_param[:rate_limit].present?
      user.rate_limit_id = RateLimitsHelper.create_rate_limits(user_param[:rate_limit]).id
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
    puts 'Done with :create_user'
  end

  def delete_user(user_param)
    user = ::User.where(id: user_param[:id]).first
    user.set_force_destroy if user_param[:force] == 'true'
    user.destroy
    notifications_topic.publish(:user_deleted, {
                                  username: user.username
                                })
  rescue CartoDB::SharedEntitiesError
    notifications_topic.publish(:user_could_not_be_deleted, {
                                  username: user.username,
                                  reason: 'user has shared entities'
                                })
  end

end

namespace :poc do
  desc 'Consume messages from subscription "central_cartodb_commands"'
  task central_cartodb_commands: [:environment] do |_task, _args|
    message_broker = Carto::Common::MessageBroker.instance
    subscription = message_broker.get_subscription(:central_cartodb_commands)
    notifications_topic = message_broker.get_topic(:cartodb_central_notifications)
    central_user_commands = CentralUserCommands.new(notifications_topic)

    subscription.register_callback(:update_user,
                                   &central_user_commands.method(:update_user))

    subscription.register_callback(:create_user,
                                   &central_user_commands.method(:create_user))

    subscription.register_callback(:delete_user,
                                   &central_user_commands.method(:delete_user))

    at_exit do
      puts 'Stopping subscribber...'
      subscription.stop!
      puts 'done'
    end

    subscription.start
    puts 'Consuming messages from subscription "central_cartodb_commands"'
    sleep
  end
end
