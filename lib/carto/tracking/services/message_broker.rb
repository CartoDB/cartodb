require 'google/cloud/pubsub'
require 'carto/tracking/services/pubsub_generic'

module Carto
  module Tracking
    module Services
      module PubSub
        class MessageBroker < Carto::Tracking::Services::PubSub::PubSubGeneric

          def pubsub_topics
            {
              cartodb_to_central: @pubsub.topic('poc_cartodb_central_sync')
            }
          end

          def project_id
            @project_id ||= Cartodb.get_config(:message_broker, 'project_id')
          end

          def credentials
            @credentials ||= Cartodb.get_config(:message_broker, 'credentials')
          end

        end
      end
    end
  end
end
