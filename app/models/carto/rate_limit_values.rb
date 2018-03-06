module Carto
  class RateLimitValues
    extend Forwardable
    delegate [:first,
              :second,
              :all,
              :push,
              :pop,
              :each,
              :flat_map,
              :empty?,
              :length,
              :<<,
              :[],
              :[]=,
              :clear] => :@rate_limits

    VALUES_PER_RATE_LIMIT = 3

    def initialize(values)
      @rate_limits = []
      values = convert_from_db_array(values)

      values.each_slice(VALUES_PER_RATE_LIMIT) do |slice|
        push(RateLimitValue.new(slice))
      end
    end

    def to_redis_array
      RateLimitValues.dump(self)
    end

    def self.dump(rate_limit_values)
      return [] if rate_limit_values.nil?
      rate_limit_values.validate

      Carto::InsertableArray.new(rate_limit_values.flat_map(&:to_array))
    end

    def self.load(values)
      RateLimitValues.new(values)
    end

    def validate
      raise 'Error. Empty rate limits for endpoint' if @rate_limits.empty?
      @rate_limits.each(&:valid?)
    end

    private

    def convert_from_db_array(values)
      return [] if values.nil? || values.empty?
      return values.delete('{}').split(',') if values.is_a? String
      values
    end
  end

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
