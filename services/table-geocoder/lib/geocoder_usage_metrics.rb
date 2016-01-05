# encoding: utf-8

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class GeocoderUsageMetrics
    # TODO generalize metric tracking function
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

    def incr_processable_rows(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

    def incr_success_rows(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

    def incr_empty_rows(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

    def incr_failed_rows(n=1)
      # TODO implement
      CartoDB.notify_debug "#{__method__}(n=#{n})"
    end

  end
end
