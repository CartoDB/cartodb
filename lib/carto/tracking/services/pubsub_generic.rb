require 'singleton'
require 'google/cloud/pubsub'

module Carto
  module Tracking
    module Services
      module PubSub
        class PubSubGeneric
          include Singleton
          include ::LoggerHelper

          def initialize
            @pubsub = init_pubsub
            @errored = false

            @topics = pubsub_topics

          rescue StandardError => e
            @errored = true
            log_error(message: "#{self.class.name}: initialization error", exception: e)
          end

          def init_pubsub
            params = { project_id: project_id, credentials: credentials }.compact
            @pubsub = Google::Cloud::Pubsub.new(params)
          end

          def enabled?
            @pubsub.present? && !@errored
          end

          def send_event(topic_key, event, attributes = {})
            return unless enabled?

            event = event.to_json if event.is_a? Hash
            topic = @topics.fetch(topic_key)
            result = topic.publish(event, attributes)

            unless result
              log_error(message: "#{self.class.name}: error sending event", event: event, topic: { name: topic.name })
            end

            attributes

          rescue KeyError => e
            log_error(message: "#{self.class.name}: topic not found", exception: e, topic: { key: topic_key })
          rescue StandardError => e
            log_error(message: "#{self.class.name}: error sending event", exception: e)
          end

        end
      end
    end
  end
end
