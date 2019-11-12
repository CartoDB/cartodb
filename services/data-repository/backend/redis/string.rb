require 'json'
require 'redis'

module DataRepository
  module Backend
    class Redis
      class String
        def initialize(redis=Redis.new)
          @redis = redis
        end #initialize

        def store(key, data)
          redis.set key, data.to_json
        end #store

        def fetch(key)
          JSON.parse redis.get(key)
        end #fetch

        private

        attr_reader :redis
      end # String
    end # Redis
  end # Backend
end # DataRepository

