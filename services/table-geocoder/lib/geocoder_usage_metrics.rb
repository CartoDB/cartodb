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
    ]

    VALID_SERVICES = [
      :geocoder_internal,
      :geocoder_here,
      :geocoder_google,
      :geocoder_cache
    ]

    def initialize(redis, username, orgname=nil)
      @username = username
      @orgname = orgname
      @redis = redis
    end

    def incr(service, metric, amount=1)
      check_valid_data(service, metric, amount)
      return if amount == 0

      # TODO We could add EXPIRE command to add TTL to the keys
      if !@orgname.nil?
        @redis.zincrby("#{org_key_prefix(service, metric)}", amount, "#{current_day}")
      end

      @redis.zincrby("#{user_key_prefix(service, metric)}", amount, "#{current_day}")
    end

    private

    def check_valid_data(service, metric, amount)
      raise 'Invalid service' unless VALID_SERVICES.include?(service)
      raise 'invalid metric' unless VALID_METRICS.include?(metric)
      raise 'invalid amount' if amount < 0
    end

    def user_key_prefix(service, metric)
      "user:#{@username}:#{service}:#{metric}:#{current_year_month}"
    end

    def org_key_prefix(service, metric)
      "org:#{@orgname}:#{service}:#{metric}:#{current_year_month}"
    end

    def current_day
      DateTime.now.day
    end

    def current_year_month
      DateTime.now.strftime('%Y%m')
    end

  end

  class RedisStub
    def incrby(key, increment)
      CartoDB.notify_debug("redis.incr(#{key}, #{increment})")
    end
  end

end
