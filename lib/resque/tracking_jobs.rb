# encoding utf-8

require 'carto/tracking/services/segment'

module Resque
  module TrackingJobs
    module SendSegmentEvent
      include Carto::Tracking::Services::Segment

      @queue = :tracker

      def self.perform(user_id, name, properties)
        return unless segment_api_key

        segment = Segment::Analytics.new(write_key: segment_api_key)
        segment.track(user_id: user_id, event: name, properties: properties)
        segment.flush
      rescue => exception
        CartoDB::Logger.warning(message: 'Can\'t report to Segment',
                                exception: exception,
                                event: name,
                                properties: properties)
      end
    end
  end
end
