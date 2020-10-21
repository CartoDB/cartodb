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
