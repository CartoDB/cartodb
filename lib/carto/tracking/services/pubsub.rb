module Carto
  module Tracking
    module Services
      module PubSub
        def report_to_pubsub
          supplied_properties = @format.to_pubsub
          Resque.enqueue(Resque::TrackingJobs::SendPubSubEvent, @reporter.try(:id), pubsub_name, supplied_properties)
        end
      end
    end
  end
end

