module Carto
  class RateLimitValues

    extend Forwardable
    delegate [:<<,
              :[],
              :[]=,
              :all,
              :clear,
              :each,
              :empty?,
              :flat_map,
              :first,
              :length,
              :pop,
              :present?,
              :push,
              :second] => :@rate_limits

    VALUES_PER_RATE_LIMIT = 3

    def initialize(values)
      @rate_limits = []
      values = convert_from_db_array(values)

      values.each_slice(VALUES_PER_RATE_LIMIT) do |slice|
        push(Carto::RateLimitValue.new(slice))
      end
    end

    def to_array
      flat_map(&:to_array)
    end

    def ==(other)
      other.class == self.class && to_array == other.try(:to_array)
    end

    def to_redis_array
      self.class.dump(self)
    end

    def self.dump(rate_limit_values)
      return [] if rate_limit_values.nil?

      rate_limit_values.flat_map(&:to_array)
    end

    def self.load(values)
      new(values)
    end

    private

    def convert_from_db_array(values)
      return [] if values.blank?
      return values.delete('{}').split(',') if values.is_a? String

      values
    end

  end
end
