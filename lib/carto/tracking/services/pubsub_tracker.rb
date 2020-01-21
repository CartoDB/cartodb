require 'singleton'
require 'google/cloud/pubsub'


class PubSubTracker
  include Singleton

  def initialize
    @pubsub = init_pubsub
    @errored = false

    @topics = {
      metrics: metrics_topic
    }

  rescue StandardError => e
    @errored = true
    CartoDB::Logger.error(message: 'PubSubTracker: initialization error', exception: e)
  end

  def init_pubsub
    project_id = Cartodb.get_config(:pubsub, 'project_id')
    credentials = Cartodb.get_config(:pubsub, 'credentials')

    params = { project_id: project_id, credentials: credentials }.compact
    @pubsub = Google::Cloud::Pubsub.new(params)
  end

  def metrics_topic
    topic_name = Cartodb.get_config(:pubsub, 'topic')
    @pubsub.topic(topic_name)
  end

  def enabled?
    @pubsub.present? && !@errored
  end

  def send_event(topic_key, user_id, event, properties = {})
    return unless user_id.present? && enabled?

    topic = @topics.fetch(topic_key)
    attributes = {user_id: user_id}.merge(properties)

    topic.publish_async(event, attributes) do |result|
      if result&.succeeded?
        CartoDB::Logger.info(message: "PubSubTracker: event #{event} published to #{topic.name}")
      else
        CartoDB::Logger.error(message: "PubSubTracker: error publishing to topic #{topic.name} for event #{event}: #{result&.error}")
      end
    end

    attributes

  rescue KeyError => e
    CartoDB::Logger.error(message: "PubSubTracker: error topic key #{topic_key} not found")
  rescue StandardError => e
    CartoDB::Logger.error(message: e.message, exception: e)
  end

  def graceful_shutdown
    return unless enabled?

    @topics.each_value do |topic|
      begin
        stop_publisher(topic) unless topic.async_publisher.nil? || topic.async_publisher.stopped?
        CartoDB::Logger.info(message: "PubSubTracker: topic #{topic.name} successfully stopped")
      rescue StandardError => e
        CartoDB::Logger.error(message: e.message, exeption: e)
      end
    end
  rescue StandardError => e
    CartoDB::Logger.error(message: e.message, exeption: e)
  end

  # Method needed for testing purposes
  def stop_publisher(topic)
    topic.async_publisher.stop!
  end

end
