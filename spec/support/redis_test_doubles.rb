module RedisDoubles
  class RedisSpy
    attr_reader :deleted

    def initialize
      @deleted = []
      @invokes = Hash.new([])
    end

    def del(keys)
      @deleted.concat(keys)
      @invokes[:del] << keys
    end

    def invokes(method_name)
      @invokes[method_name]
    end

  end
end
