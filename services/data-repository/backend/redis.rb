require 'redis'
require_relative 'redis/set'
require_relative 'redis/string'

module DataRepository
  module Backend
    class Redis

      HANDLERS =  {
        'set'     => Backend::Redis::Set,
        'string'  => Backend::Redis::String
      }

      def initialize(redis=::Redis.new)
        @redis = redis
      end #initialize

      def store(key, data, options={})
        persister_for(data).new(redis).store(key, data)
        expire_in(options.fetch(:expiration, nil), key)
      end #store

      def fetch(key)
        return nil unless redis.exists(key)
        retriever_for(key).new(redis).fetch(key)
      end #fetch

      def keys
        redis.keys
      end #keys

      def exists?(key)
        redis.exists(key)
      end #exists?

      def delete(key)
        redis.del(key)
      end #delete

      # Not supported, so just call data
      def transaction(&block)
        block.call
      end

      private

      attr_reader :redis

      def expire_in(seconds, key)
        !!seconds && redis.expire(key, seconds)
      end #expire_in

      def retriever_for(key)
        HANDLERS.fetch(redis.type(key), Backend::Redis::String)
      end #retriever_for

      def persister_for(data)
        HANDLERS.fetch(data.class.to_s.downcase, Backend::Redis::String)
      end #persister_for(data)
    end # Redis
  end # Backend
end # DataRepository

