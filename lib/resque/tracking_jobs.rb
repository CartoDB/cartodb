# encoding utf-8

require 'hubspot/events_api'

module Resque
  module TrackingJobs
    module SendSegmentEvent
      @queue = :tracker

      def self.perform(user_id, name, properties)
        segment_api_key = Cartodb.get_config(:segment, 'api_key')
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

    module SendHubspotEvent
      @queue = :tracker

      def self.perform(id, params)
        Hubspot::EventsAPI.instance.report_event(id, params)
      end
    end
  end
end
