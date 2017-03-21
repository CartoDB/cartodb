# encoding: utf-8

require 'active_support/time'

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class ServiceUsageMetrics

    def initialize(username, orgname = nil, redis=$geocoder_metrics)
      @username = username
      @orgname = orgname
      @redis = redis
    end

    def incr(service, metric, amount = 1, date = DateTime.current)
      check_valid_data(service, metric)
      assert_valid_amount(amount)
      return if amount == 0

      # TODO We could add EXPIRE command to add TTL to the keys
      if !@orgname.nil?
        @redis.zincrby("#{org_key_prefix(service, metric, date)}", amount, "#{date_day(date)}")
      end

      @redis.zincrby("#{user_key_prefix(service, metric, date)}", amount, "#{date_day(date)}")
    end

    def get(service, metric, date = DateTime.current)
      check_valid_data(service, metric)

      total = 0
      if !@orgname.nil?
        total += @redis.zscore(org_key_prefix(service, metric, date), date_day(date)) || 0
      else
        total += @redis.zscore(user_key_prefix(service, metric, date), date_day(date)) || 0
      end

      total
    end

    protected

    def check_valid_data(_service, _metric)
      raise NotImplementedError.new("You must implement check_valid_data in your metrics class.")
    end

    private

    def user_key_prefix(service, metric, date)
      "user:#{@username}:#{service}:#{metric}:#{date_year_month(date)}"
    end

    def org_key_prefix(service, metric, date)
      "org:#{@orgname}:#{service}:#{metric}:#{date_year_month(date)}"
    end

    def date_day(date)
      date.strftime('%d')
    end

    def date_year_month(date)
      date.strftime('%Y%m')
    end

    def assert_valid_amount(amount)
      raise ArgumentError.new('Invalid metric amount') if amount.nil? || amount <= 0
    end

  end
end
