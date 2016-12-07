# encoding: utf-8

require 'hubspot/events_api'

module Resque
  module TrackingJobs
    module SendSegmentEvent
      @queue = :tracker

      def self.perform(user_id, name, properties)
        return unless segment_api_key = Cartodb.get_config(:segment, 'api_key')

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
        events_api = ::Hubspot::EventsAPI.instance
        return unless events_api.enabled?

        code, body = events_api.report(id, params: params)

        unless code == '200' && body.present?
          message = 'Carto::Tracking: Hubspot service error'
          CartoDB::Logger.error(message: message, event_id: id, params: params)
        end
      end
    end
  end
end
