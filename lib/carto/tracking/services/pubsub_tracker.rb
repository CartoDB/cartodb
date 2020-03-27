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

    result = topic.publish(event, attributes)

    unless result
      CartoDB::Logger.error(message: "PubSubTracker: error publishing to topic #{topic.name} for event #{event}")
    end

    attributes

  rescue KeyError => e
    CartoDB::Logger.error(message: "PubSubTracker: error topic key #{topic_key} not found")
  rescue StandardError => e
    CartoDB::Logger.error(message: e.message, exception: e)
  end

end
