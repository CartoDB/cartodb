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

    VALID_SERVICES = [
      :internal_geocoder,
      :here_geocoder,
      :google_geocoder
    ]

    def initialize(username, service, redis)
      raise 'Invalid service' unless VALID_SERVICES.include?(service)
      @username = username
      @service = service
      @redis = redis
    end

    def incr(metric, amount=1)
      raise 'invalid amount' if amount < 0
      raise 'invalid metric' unless VALID_METRICS.include?(metric)
      return if amount == 0

      @redis.incrby("#{key_prefix}:#{metric}:#{current_date}", amount)
    end

    private

    # TODO: actually this should cover also orgs
    def key_prefix
      "user:#{@username}:#{@service}"
    end

    def current_date
      DateTime.now.strftime('%Y%m%d')
    end

  end


  class RedisStub
    def incrby(key, increment)
      CartoDB.notify_debug("redis.incr(#{key}, #{increment})")
    end
  end

end
