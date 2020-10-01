require 'bunny'

namespace :bus do
    desc 'Consume messages from bus'
    task :consume, [] => [:environment] do |task, args|
      amqp_connection = Bunny.new("amqp://guest:guest@rabbitmq:5672")
      amqp_connection.start

      $rabbit = amqp_connection.create_channel
      $rabbit.prefetch(1)
      queue = $rabbit.queue("cloud-sync-users")

      queue.subscribe(block: true) do |delivery_info, metadata, payload|
        attributes = JSON.parse(payload)
        user_id = attributes.delete("remote_user_id")
        if !user_id.nil? && attributes.any?
          user = Carto::User.find(user_id)
          user.update(attributes)
          user.save!
        end
      end

      amqp_connection.close
    end
end
