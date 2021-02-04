module Carto
  class RateLimitValue

    attr_accessor :max_burst, :count_per_period, :period

    def initialize(values)
      @values = values
      self.max_burst, self.count_per_period, self.period = values.map(&:to_i) if valid?
    end

    def valid?
      values_per_rate_limit = Carto::RateLimitValues::VALUES_PER_RATE_LIMIT
      if !@values || @values.length < values_per_rate_limit && @values.length % values_per_rate_limit != 0
        raise 'Error: Number of rate limits needs to be multiple of three'
      end

      true
    end

    def to_array
      [max_burst, count_per_period, period]
    end

  end
end
