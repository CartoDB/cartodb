def process_exists?(pid)
  Process.getpgid(pid)
  true
rescue Errno::ESRCH
  false
end

namespace :message_broker do
  desc 'Consume messages from subscription "central_cartodb_commands"'
  task cartodb_subscribers: [:environment] do |_task, _args|
    # Eager load Ruby classes, as Rake does not do it by default
    # https://github.com/rails/rails/issues/28358
    Rails.application.eager_load!

    $stdout.sync = true
    logger = Carto::Common::Logger.new($stdout)
    pid_file = ENV['PIDFILE'] || Rails.root.join('tmp/pids/cartodb_subscribers.pid')

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
      subscription_name = Carto::Common::MessageBroker::Config.instance.central_subscription_name
      subscription = message_broker.get_subscription(subscription_name)
      notifications_topic = message_broker.get_topic(:cartodb_central)
      central_user_commands = CentralUserCommands.new(
        notifications_topic: notifications_topic,
        logger: logger
      )

      subscription.register_callback(:update_user,
                                     &central_user_commands.method(:update_user))

      subscription.register_callback(:create_user,
                                     &central_user_commands.method(:create_user))

      subscription.register_callback(:delete_user,
                                     &central_user_commands.method(:delete_user))

      subscription.register_callback(:update_organization) do |message|
        OrganizationCommands::Update.new(message.payload, { logger: logger, request_id: message.request_id }).run
      end

      subscription.register_callback(:create_organization) do |message|
        OrganizationCommands::Create.new(
          message.payload,
          { notifications_topic: notifications_topic, logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:delete_organization) do |message|
        OrganizationCommands::Delete.new(
          message.payload,
          { notifications_topic: notifications_topic, logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:create_feature_flag) do |message|
        FeatureFlagCommands::Create.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:update_feature_flag) do |message|
        FeatureFlagCommands::Update.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:delete_feature_flag) do |message|
        FeatureFlagCommands::Delete.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:create_price_plan) do |message|
        AccountTypeCommands::Create.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:update_price_plan) do |message|
        AccountTypeCommands::Update.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:delete_price_plan) do |message|
        AccountTypeCommands::Delete.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:create_do_api_key) do |message|
        RemoteDoApiKeyCommands::Create.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:destroy_do_api_key) do |message|
        RemoteDoApiKeyCommands::Destroy.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      subscription.register_callback(:set_do_gcloud_settings) do |message|
        GcloudUserSettingsCommands::Set.new(
          message.payload,
          { logger: logger, request_id: message.request_id }
        ).run
      end

      at_exit do
        logger.info(message: 'Stopping subscriber...')
        subscription.stop!
        logger.info(message: 'Subscriber stopped')
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
