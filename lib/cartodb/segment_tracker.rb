require 'segment/analytics'

module Cartodb

  # Development info: https://segment.com/docs/libraries/ruby/quickstart
  class SegmentTracker

    def initialize
      @api_key = Cartodb.config[:segment]['api_key']
      @analytics = Segment::Analytics.new({
        write_key: @api_key    
      })
    end

    def enabled?
      !@api_key.nil?
    end

    def track_event(user_id, event, properties)
      return unless enabled?

      begin
        @analytics.track(
          user_id: user_id,
          event: event,
          properties: properties
        )
      rescue Exception => e
      Rollbar.report_message('Segment error tracking event', 'error', { user: user_id, event: event })
      end
    end

    def flush
      begin
        @analytics.flush
      rescue Exception => e
        Rollbar.report_message('Segment error flush', 'error')
      end
    end
  end
end
