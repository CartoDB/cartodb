require 'singleton'
require 'google/cloud/pubsub'


class PubSubTracker
  include Singleton

  MAX_BYTES_BATCH = 500_000
  MAX_MESSAGES_BATCH = 5

  def initialize
    @topic_name = Cartodb.get_config(:pubsub, 'topic')
    @pubsub = init_pubsub
    @errored = false

    @topics = {
      metrics: metrics_topic
    }

  rescue StandardError => e
    @errored = true
    CartoDB::Logger.error(message: 'PubSub: initialization error', exception: e)
  end

  def init_pubsub
    project_id = Cartodb.get_config(:pubsub, 'project_id')
    credentials = Cartodb.get_config(:pubsub, 'credentials')

    return Google::Cloud::Pubsub.new unless project_id.present?

    return Google::Cloud::Pubsub.new(project_id: project_id) unless credentials.present?

    @pubsub = Google::Cloud::Pubsub.new(project_id: project_id, credentials: credentials)
  end

  def metrics_topic
    @pubsub.topic(@topic_name, async: {
      max_bytes: MAX_BYTES_BATCH,
      max_messages: MAX_MESSAGES_BATCH
    })
  end

  def enabled?
    @pubsub.present? && !@errored
  end

  def send_event(topic_key, user_id, event, properties = {})
    return unless user_id.present? && enabled?

    topic = @topics.fetch(topic_key)
    attributes = {user_id: user_id}.merge(properties)

    topic.publish_async(event, attributes) do |result|
      raise "PubSub: error publishing to topic #{@topic_name} for event #{event}" unless result&.succeeded?
    end

    attributes

  rescue KeyError => e
    CartoDB::Logger.error(message: "Error: topic #{topic_key} does not exist")
  rescue StandardError => e
    CartoDB::Logger.error(message: e.message, exception: e)
  end

  def graceful_shutdown
    return unless enabled?

    @topics.each_value do |topic|
      begin
        stop_publisher(topic) unless topic.async_publisher.nil? || topic.async_publisher.stopped?
      rescue StandardError => e
        CartoDB::Logger.error(message: e.message, exeption: e)
      end
    end
  rescue StandardError => e
    CartoDB::Logger.error(message: e.message, exeption: e)
  end

  # Method needed for testing purposes
  def stop_publisher(topic)
    topic.async_publisher.stop.wait!
  end

end
