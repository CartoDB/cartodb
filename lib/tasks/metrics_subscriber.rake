require './lib/carto/subscribers/central_user_commands'

namespace :message_broker do
  desc 'Consume messages from subscription "central_cartodb_commands"'
  task cartodb_metrics_subscribers: [:environment] do |_task, _args|
    pid_file = ENV['PIDFILE'] || Rails.root.join('tmp/pids/cartodb_metrics_subscribers.pid')
    raise "PID file exists: #{pid_file}" if File.exist?(pid_file)

    File.open(pid_file, 'w') { |f| f.puts Process.pid }

    begin
      $stdout.sync = true
      logger = Carto::Common::Logger.new($stdout)

      message_broker = Carto::Common::MessageBroker.new(logger: logger)
      subscription_name = Carto::Common::MessageBroker::Config.instance.metrics_subscription_name
      subscription = message_broker.get_subscription(subscription_name)

      map_views_update = Carto::Subscribers::MapViewsUpdate.new

      subscription.register_callback(
        'update_map_views', # `event` attribute of the message
        &map_views_update.method(:update_map_views)
      )

      at_exit do
        logger.info(message: 'Stopping subscriber...')
        subscription.stop!
        logger.info(message: 'Done')
      end

      subscription.start
      logger.info(message: 'Consuming messages from subscription')
      sleep
    rescue StandardError => e
      logger.error(exception: e)
      exit(1)
    ensure
      File.delete(pid_file)
    end
  end
end
