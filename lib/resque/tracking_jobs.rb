require 'hubspot/events_api'
require 'carto/tracking/services/pubsub_tracker'

module Resque
  module TrackingJobs
    module SendPubSubEvent
      include Carto::Common::JobLogger

      @queue = :tracker

      def self.perform(user_id, name, properties)
        PubSubTracker.instance.send_event(:metrics, user_id, name, properties)
      end
    end

    module SendSegmentEvent
      include Carto::Common::JobLogger
      extend ::LoggerHelper

      ANONYMOUS_SEGMENT_USER_ID = '00000000-0000-0000-0000-000000000000'.freeze

      @queue = :tracker

      def self.perform(user_id, name, properties)
        return unless segment_api_key = Cartodb.get_config(:segment, 'api_key')

        segment = Segment::Analytics.new(write_key: segment_api_key)
        segment.track(user_id: user_id || ANONYMOUS_SEGMENT_USER_ID, event: name, properties: properties)
        segment.flush
      rescue StandardError => e
        log_warning(message: "Can't report to Segment", exception: e, event: { name: name }, properties: properties)
      end
    end

    module SendHubspotEvent
      include Carto::Common::JobLogger
      extend ::LoggerHelper

      @queue = :tracker

      def self.perform(id, params)
        events_api = ::Hubspot::EventsAPI.instance
        return unless events_api.enabled?

        code, body = events_api.report(id, params: params)

        if code != '200' || body.blank?
          log_error(message: 'Carto::Tracking: Hubspot service error', event: { id: id }, params: params)
        end
      end
    end
  end
end
