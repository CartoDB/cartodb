module Carto
  class RateLimitValues
    attr_accessor :rate_limits

    VALUES_PER_RATE_LIMIT = 3

    def initialize(values)
      @rate_limits = []
      values = convert_to_array(values)

      return if !values || values.length % VALUES_PER_RATE_LIMIT != 0

      values.each_slice(VALUES_PER_RATE_LIMIT) do |slice|
        @rate_limits.push(RateLimitValue.new(slice))
      end
    end

    def to_redis_array
      result = []
      @rate_limits.reverse.each do |rate_limit|
        result.push(rate_limit.period)
              .push(rate_limit.count_per_period)
              .push(rate_limit.max_burst)
      end

      result
    end

    def self.dump(rate_limit_values)
      return [] if rate_limit_values.nil?

      result = []
      rate_limit_values.rate_limits.each_value do |rate_limit|
        result.push(rate_limit.max_burst)
              .push(rate_limit.count_per_period)
              .push(rate_limit.period)
      end

      result
    end

    def self.load(values)
      RateLimitValues.new(values)
    end

    private

    def convert_to_array(values)
      return [] if values.nil? || values.empty?
      return values.delete('{}').split(',') if values.is_a? String
      values
    end
  end

  class RateLimitValue
    attr_accessor :max_burst, :count_per_period, :period

    def initialize(values)
      self.max_burst = values[0].to_i
      self.count_per_period = values[1].to_i
      self.period = values[2].to_i
    end
  end
end
