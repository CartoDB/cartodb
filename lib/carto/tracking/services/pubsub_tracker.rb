require 'carto/tracking/services/pubsub_generic'

class PubSubTracker < Carto::Tracking::Services::PubSub::PubSubGeneric

  def pubsub_topics
    topic_name = Cartodb.get_config(:pubsub, 'topic')
    {
      metrics: @pubsub.topic(topic_name)
    }
  end

  def project_id
    @project_id ||= Cartodb.get_config(:pubsub, 'project_id')
  end

  def credentials
    @credentials ||= Cartodb.get_config(:pubsub, 'credentials')
  end

  def send_event(topic_key, user_id, event, properties = {})
    return unless user_id.present? && enabled?
    attributes = {user_id: user_id}.merge(properties)
    super topic_key, event, attributes
  end

end
