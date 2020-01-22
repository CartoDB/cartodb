module Carto
  module Tracking
    module Services
      module PubSub
        def report_to_pubsub
          return unless pubsub_topic

          supplied_properties = @format.to_pubsub
          Resque.enqueue(Resque::TrackingJobs::SendPubSubEvent, @reporter.try(:id), pubsub_name, supplied_properties)
        end

        def pubsub_topic
          @pubsub_topic ||= Cartodb.get_config(:pubsub, 'topic')
        end
      end
    end
  end
end

