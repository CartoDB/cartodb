# encoding: utf-8

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class GeocoderUsageMetrics

    VALID_METRICS = [
      :total_requests,
      :failed_responses,
      :success_responses,
      :empty_responses,
      :processable_rows,
      :success_rows,
      :empty_rows,
      :failed_rows
    ]

    def incr(metric, amount=1)
      raise 'invalid amount' if amount < 0
      raise 'invalid metric' unless VALID_METRICS.include?(metric)
      return if amount == 0
      # TODO implement
      CartoDB.notify_debug("incr(#{metric}, #{amount})")
    end

  end
end
