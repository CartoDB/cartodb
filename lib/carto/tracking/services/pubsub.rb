require 'carto/tracking/services/pubsub_tracker'

module Carto
  module Tracking
    module Services
      module PubSub
        def report_to_pubsub
          supplied_properties = @format.to_pubsub
          PubSubTracker.instance.send_event(:metrics, @reporter.try(:id), pubsub_name, supplied_properties)
        end
      end
    end
  end
end

