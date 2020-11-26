namespace :message_broker do
  desc 'Consume messages from "TODO" topic with map_views agreggated by users'
  task map_views_subscriber: [:environment] do |_task, _args|
    include ::LoggerHelper

    message_broker = Carto::Common::MessageBroker.instance
    subscription_name = 'testing-subscription' # TODO
    topic_name = 'testing-output-topic' # TODO

    # Setup...
    topic = message_broker.create_topic(topic_name) # get_or_create_topic indeed

    topic.create_subscription(subscription_name) # TODO: This should return a Subscription wrapper object
    subscription = message_broker.get_subscription(subscription_name)

    map_views_update = Carto::Subscribers::MapViewsUpdate.new()

    subscription.register_callback(
      :update_map_views,
      &map_views_update.method(:update_map_views)
    )
    at_exit do
      log_debug(message: 'Stopping subscriber...')
      subscription.stop!
      log_debug(message: 'Done')
    end

    subscription.start
    log_debug(message: 'Consuming messages from subscription')
    sleep
  end
end
