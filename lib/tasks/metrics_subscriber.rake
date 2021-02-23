namespace :message_broker do
  desc 'Consume messages from subscription "central_cartodb_commands"'
  task cartodb_metrics_subscribers: [:environment] do |_task, _args|
    # Eager load Ruby classes, as Rake does not do it by default
    # https://github.com/rails/rails/issues/28358
    Rails.application.eager_load!

    $stdout.sync = true
    logger = Carto::Common::Logger.new($stdout)
    pid_file = ENV['PIDFILE'] || Rails.root.join('tmp/pids/cartodb_metrics_subscribers.pid')

    if File.exist?(pid_file)
      pid = File.read(pid_file).to_i

      raise "PID file exists: #{pid_file}" if process_exists?(pid)

      # A warning should be better, but let's keep it like so until the MessageBroker is stable enough
      logger.error(message: 'PID file exists, but process is not running. Removing PID file.')
      File.delete(pid_file)
    end

    File.open(pid_file, 'w') { |f| f.puts Process.pid }

    begin
      message_broker = Carto::Common::MessageBroker.new(logger: logger)
      subscription_name = Carto::Common::MessageBroker::Config.instance.metrics_subscription_name
      subscription = message_broker.get_subscription(subscription_name)

      subscription.register_callback(:update_map_views) do |message|
        begin
          MapViewsCommands::Update.new(message.payload, { logger: logger }).run
        rescue StandardError => e
          Rails.logger.error(exception: e)
          # These messages are not critical, so let's do a manual ACK to avoid saturating the subscription in case of
          # recurrent failures. This applies also to the dead letter queue.
          message.ack!
        end
      end

      at_exit do
        logger.info(message: 'Stopping subscriber...')
        subscription.stop!
        logger.info(message: 'Done')
      end

      subscription.start
      logger.info(message: 'Consuming messages from subscription', subscription_name: subscription_name)
      sleep
    rescue StandardError => e
      logger.error(exception: e)
      exit(1)
    ensure
      File.delete(pid_file)
    end
  end
end
