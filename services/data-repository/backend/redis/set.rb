require 'redis'

module DataRepository
  module Backend
    class Redis
      class Set
        def initialize(redis=Redis.new)
          @redis = redis
        end #initialize

        def store(key, data)
          workaround_until_resque_supports_latest_redis_gem(key, data)
        end #store

        def fetch(key)
          redis.smembers key
        end #fetch

        private

        attr_reader :redis

        def workaround_until_resque_supports_latest_redis_gem(key, data)
          redis.multi do
            data.to_a.each { |item| redis.sadd(key, item) }
          end
        end #workaround_until_resque_supports_latest_redis_gem
      end # Set
    end # Redis
  end # Backend
end # DataRepository

