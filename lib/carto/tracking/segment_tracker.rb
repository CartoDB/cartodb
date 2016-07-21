require 'segment/analytics'

# Development info: https://segment.com/docs/libraries/ruby/quickstart

module Carto
  module Tracking
    class SegmentTracker
      def initialize
        @api_key = Cartodb.config[:segment]['api_key']
        @analytics = Segment::Analytics.new(write_key: @api_key)
      end

      def track_event(user_id, event, properties)
        return unless @api_key.present? && user_id.present?

        @analytics.track(user_id: user_id, event: event, properties: properties)
      rescue => exception
        CartoDB::Logger.error(message: 'SegmentTracker: segment event tracking error',
                              exception: exception,
                              user_id: user_id,
                              event: event,
                              properties: properties)
      end

      def flush
        @analytics.flush
      rescue => exception
        CartoDB::Logger.error(message: 'SegmentTracker: segment flushing error', exception: exception)
      end
    end
  end
end
