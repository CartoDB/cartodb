module CartoDB
  class MetricsRedisRepository

    @@instance = nil

    def initialize(redis_conn = $users_metadata)
      @redis_conn = redis_conn
    end

    def self.instance
      @@instance = MetricsRedisRepository.new if @@instance.nil?
      @@instance
    end

    def store(prefix, key, value)
      @redis_conn.zincrby(prefix, value, key)
    rescue Redis::BaseError => exception
      CartoDB.notify_error('Error trying to store a metric in redis', { key: key, exception: exception.inspect })
      false
    end

    def get(key, value)
      @redis_conn.get()
    rescue Redis::BaseError => exception
      CartoDB.notify_error('Error trying to get a metric from redis', { key: key, exception: exception.inspect })
      false
    end

  end
end
