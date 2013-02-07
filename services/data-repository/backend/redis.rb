# encoding: utf-8
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

      class Set
        def initialize(redis=Redis.new)
          @redis = redis
        end #initialize

        def store(key, data)
          redis.sadd key, *(data.to_a)
        end #store

        def fetch(key)
          redis.smembers key
        end #fetch

        private

        attr_reader :redis
      end # Set

      HANDLERS =  {
        'set'     => Backend::Redis::Set,
        'string'  => Backend::Redis::String
      }

      def initialize(redis=::Redis.new)
        @redis = redis
      end #initialize

      def store(key, data, options={})
        persister_for(data).new(redis).store(key, data)
      end #store

      def fetch(key)
        retriever_for(key).new(redis).fetch(key)
      end #fetch

      def keys
        redis.keys
      end #keys

      private

      attr_reader :redis

      def retriever_for(key)
        HANDLERS.fetch(redis.type(key), Backend::Redis::String)
      end #retriever_for

      def persister_for(data)
        HANDLERS.fetch(data.class.to_s.downcase, Backend::Redis::String)
      end #persister_for(data)
    end # Redis
  end # Backend
end # DataRepository

