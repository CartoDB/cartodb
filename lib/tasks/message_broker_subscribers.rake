require './lib/carto/subscribers/central_user_commands'

namespace :message_broker do
  desc 'Consume messages from subscription "central_cartodb_commands"'
  task cartodb_subscribers: [:environment] do |_task, _args|
    pid_file = ENV['PIDFILE'] || Rails.root.join('tmp/pids/cartodb_subscribers.pid')
    raise "PID file exists: #{pid_file}" if File.exist?(pid_file)

    File.open(pid_file, 'w') { |f| f.puts Process.pid }

    begin
      $stdout.sync = true
      logger = Carto::Common::Logger.new($stdout)

      message_broker = Carto::Common::MessageBroker.new(logger: logger)
      central_subscription = init_central_subscriber(message_broker, logger)
      metrics_subscription = init_metrics_subscriber(message_broker, logger)

      at_exit do
        logger.info(message: 'Stopping subscriber...')
        central_subscription.stop!
        metrics_subscription.stop!
        logger.info(message: 'Done')
      end

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

def init_central_subscriber(message_broker, logger)
  subscription_name = Carto::Common::MessageBroker::Config.instance.central_subscription_name
  subscription = message_broker.get_subscription(subscription_name)
  notifications_topic = message_broker.get_topic(:cartodb_central)
  central_user_commands = Carto::Subscribers::CentralUserCommands.new(
    notifications_topic: notifications_topic,
    logger: logger
  )

  subscription.register_callback(:update_user,
                                  &central_user_commands.method(:update_user))

  subscription.register_callback(:create_user,
                                  &central_user_commands.method(:create_user))

  subscription.register_callback(:delete_user,
                                  &central_user_commands.method(:delete_user))

  at_exit do
    logger.info(message: 'Stopping subscriber...')
    subscription.stop!
    logger.info(message: 'Done')
  end

  subscription.start
  logger.info(message: 'Consuming messages from subscription')
  subscription
end

def init_metrics_subscriber(message_broker, logger)
  subscription_name = Carto::Common::MessageBroker::Config.instance.metrics_subscription_name
  subscription = message_broker.get_subscription(subscription_name)

  map_views_update = Carto::Subscribers::MapViewsUpdate.new

  subscription.register_callback(
    'update_map_views', # `event` attribute of the message
    &map_views_update.method(:update_map_views)
  )

  subscription.start
  logger.info(message: 'Consuming messages from subscription')
  subscription
end