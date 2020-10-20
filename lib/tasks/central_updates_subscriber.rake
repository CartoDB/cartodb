module RateLimitsHelper
  def self.create_rate_limits(rate_limit_attributes)
    rate_limit = Carto::RateLimit.from_api_attributes(rate_limit_attributes)
    rate_limit.save!
    rate_limit
  end
end

namespace :poc do
  desc 'Consume messages from subscription "cloud_pull_update"'
  task :cloud_pull_update => [:environment] do |_task, _args|
    message_broker = Carto::Common::MessageBroker.instance
    subscription = message_broker.get_subscription(:cloud_pull_update)

    subscriber = subscription.listen do |received_message|
      begin
        puts "Received message: #{received_message.data}"

        case received_message.data.to_sym
        when :update_user
          puts 'Processing :update_user'
          attributes = received_message.attributes
          user_id = attributes.delete("remote_user_id")
          if !user_id.nil? && attributes.any?
            user = Carto::User.find(user_id)
            user.update(attributes)
            user.save!
            received_message.acknowledge!
            puts "User #{user.username} updated"
          end
        when :create_user
          # NOTE copied from the superadmin users_controller.rb
          puts 'Processing :create_user'
          user = ::User.new
          user_param = received_message.attributes
          user.set_fields_from_central(user_param, :create)
          user.enabled = true

          user.rate_limit_id = RateLimitsHelper.create_rate_limits(user_param[:rate_limit]).id if user_param[:rate_limit].present?
          if user.save
            user.reload
            CartoDB::Visualization::CommonDataService.load_common_data(user, Superadmin::UsersController) if user.should_load_common_data?
            user.update_feature_flags(user_param[:feature_flags])
          end
          CartoGearsApi::Events::EventManager.instance.notify(
            CartoGearsApi::Events::UserCreationEvent.new(
              CartoGearsApi::Events::UserCreationEvent::CREATED_VIA_SUPERADMIN, user
            )
          )
          received_message.acknowledge!
        else
          received_message.reject!
          next
        end

      rescue => ex
        puts ex
        received_message.reject!
      end
    end

    at_exit do
      puts "Stopping subscribber..."
      subscriber.stop!
      puts "done"
    end

    subscriber.start
    puts 'Consuming messages from subscription "cloud_pull_update"'
    sleep
  end
end
