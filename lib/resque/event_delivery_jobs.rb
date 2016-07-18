require_dependency 'carto/segment_tracker'

module Resque
  module EventDeliveryJobs
    module TrackEvent
      @queue = :tracker

      def self.perform(user_id, event_name, properties)
        tracker = Carto::SegmentTracker.new

        tracker.track_event(user_id, event_name, properties)
        tracker.flush
      end
    end
  end
end
