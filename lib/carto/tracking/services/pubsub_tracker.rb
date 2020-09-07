require 'singleton'
require 'google/cloud/pubsub'


class PubSubTracker
  include Singleton
  include ::LoggerHelper

  def initialize
    @pubsub = init_pubsub
    @errored = false

    @topics = {
      metrics: metrics_topic
    }

  rescue StandardError => e
    @errored = true
    log_error(message: 'PubSubTracker: initialization error', exception: e)
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
      log_error(message: 'PubSubTracker: error sending event', event: event, topic: { name: topic.name })
    end

    attributes

  rescue KeyError => e
    log_error(message: 'PubSubTracker: topic not found', exception: e, topic: { key: topic_key })
  rescue StandardError => e
    log_error(message: 'PubSubTracker: error sending event', exception: e)
  end

end
