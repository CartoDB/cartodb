module Carto
  class RateLimitValues
    attr_accessor :max_burst, :count_per_period, :period

    def initialize(values)
      values = convert_to_array(values)

      return if !values || values.length != 3

      self.max_burst = values[0].to_i
      self.count_per_period = values[1].to_i
      self.period = values[2].to_i
    end

    def to_redis_array
      [period,
       count_per_period,
       max_burst]
    end

    def self.dump(rate_limit_values)
      return [] if rate_limit_values.nil?
      [rate_limit_values.max_burst,
       rate_limit_values.count_per_period,
       rate_limit_values.period]
    end

    def self.load(values)
      RateLimitValues.new(values)
    end

    private

    def convert_to_array(values)
      return [] if values.nil? || values.empty?
      return values.delete('{}').split(',') if values.is_a? String
    end
  end
end
