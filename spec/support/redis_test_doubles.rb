module RedisDoubles
  class RedisSpy
    attr_reader :deleted

    def initialize
      @deleted = []
    end

    def del(keys)
      @deleted.concat(keys)
    end
  end
end
