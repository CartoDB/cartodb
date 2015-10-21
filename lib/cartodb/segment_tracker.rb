require 'segment/analytics'

module Cartodb
  # Development info: https://segment.com/docs/libraries/ruby/quickstart
  class SegmentTracker

    def initialize
      @api_key = Cartodb.config[:segment]['api_key']
      @analytics = Segment::Analytics.new(write_key: @api_key)
    end

    def enabled?
      !@api_key.blank?
    end

    def track_event(user_id, event, properties)
      return unless enabled?
      return if user_id.blank?

      begin
        @analytics.track(
          user_id: user_id,
          event: event,
          properties: properties
        )
      rescue => e
      Rollbar.report_message('Segment error tracking event', 'error', { user_id: user_id, 
                                                                        event: event, 
                                                                        error_message: e.inspect })
      end
    end

    def flush
      begin
        @analytics.flush
      rescue => e
        Rollbar.report_message('Segment error flush', 'error', { error_message: e.inspect })
      end
    end
  end
end
