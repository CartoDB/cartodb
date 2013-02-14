# encoding: utf-8
require 'redis'

module DataRepository
  module Backend
    class Redis
      class Set
        def initialize(redis=Redis.new)
          @redis = redis
        end #initialize

        def store(key, data)
          redis.sadd key, data.to_a
        end #store

        def fetch(key)
          redis.smembers key
        end #fetch

        private

        attr_reader :redis
      end # Set
    end # Redis
  end # Backend
end # DataRepository

