require 'google/cloud/pubsub'

namespace :poc do
  desc 'Consume messages from pubsub topic "cloud_pull_update"'
  task :cloud_pull_update, [] => [:environment] do |task, args|
    project_id = 'cartodb-on-gcp-core-team'
    subscription_name = 'cloud_pull_update'

    pubsub = Google::Cloud::Pubsub.new(project: project_id)

    subscription = pubsub.subscription(subscription_name)
    subscriber = subscription.listen do |received_message|
      puts "Received message: #{received_message.data}"

      # We just assume the message is of type
      # 'user updated in central'
      received_message.reject! unless received_message.data == 'user updated in central'

      attributes = received_message.attributes
      user_id = attributes.delete("remote_user_id")
      if !user_id.nil? && attributes.any?
        user = Carto::User.find(user_id)
        user.update(attributes)
        user.save!
      end

      received_message.acknowledge!
    rescue => ex
      puts ex
      received_message.reject!
    end

    subscriber.start
    # Let the main thread sleep for 60 seconds so the thread for listening
    # messages does not quit
    sleep 60
    subscriber.stop.wait!
  end
end
