require './lib/carto/subscribers/central_user_commands'

def wait_for_db_creation(logger)
  retries = 0
  max_retries = 25

  begin
    ActiveRecord::Base.connection
  rescue ActiveRecord::NoDatabaseError => e
    raise e if retries >= max_retries

    retries += 1
    database_name = Rails.configuration.database_configuration[Rails.env]['database']
    logger.info("Database '#{database_name}' doesn't exist. Sleeping 5 seconds before retry #{retries}/#{max_retries}")
    sleep(5)
    retry
  end
end

namespace :message_broker do
  desc 'Consume messages from subscription "central_cartodb_commands"'
  task cartodb_subscribers: [:environment] do |_task, _args|
    pid_file = ENV['PIDFILE'] || Rails.root.join('tmp/pids/cartodb_subscribers.pid')
    raise "PID file exists: #{pid_file}" if File.exist?(pid_file)

    File.open(pid_file, 'w') { |f| f.puts Process.pid }
    begin
      logger = Carto::Common::Logger.new

      wait_for_db_creation(logger) if Rails.env.development? || Rails.env.test?

      message_broker = Carto::Common::MessageBroker.new(logger: logger)
      subscription_name = Carto::Common::MessageBroker::Config.instance.central_commands_subscription
      subscription = message_broker.get_subscription(subscription_name)
      notifications_topic = message_broker.get_topic(:cartodb_central)
      central_user_commands = Carto::Subscribers::CentralUserCommands.new(notifications_topic)

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
      sleep
    rescue StandardError => e
      logger.error(exception: e)
      exit(1)
    ensure
      File.delete(pid_file)
    end
  end
end
