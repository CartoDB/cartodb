# encoding: utf-8

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class GeocoderUsageMetrics
    def incr_total_requests(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

    def incr_failed_responses(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

    def incr_success_responses(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

    def incr_empty_responses(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end
  end
end
