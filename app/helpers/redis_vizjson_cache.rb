# encoding: utf-8
module CartoDB
  module Visualization
    class RedisVizjsonCache

      # This needs to be changed whenever there're changes in the code that require invalidation of old keys
      VERSION = '1'.freeze

      def initialize(redis_cache = $tables_metadata, vizjson_version = 2)
        @redis = redis_cache
        @vizjson_version = vizjson_version
      end

      def cached(visualization_id, https_flag = false)
        key = key(visualization_id, https_flag)
        value = redis.get(key)
        if value.present?
          return JSON.parse(value, symbolize_names: true)
        else
          result = yield
          serialized = JSON.generate(result)
          redis.setex(key, 24.hours.to_i, serialized)
          return result
        end
      end

      def invalidate(visualization_id)
        VIZJSON_VERSION_KEY.values.each do |vizjson_version_key|
          redis.del [key(visualization_id, false, vizjson_version_key), key(visualization_id, true, vizjson_version_key)]
        end
      end

      def key(visualization_id, https_flag = false, vizjson_version = @vizjson_version)
        "visualization:#{visualization_id}:vizjson#{VIZJSON_VERSION_KEY[vizjson_version]}:#{VERSION}:#{https_flag ? 'https' : 'http'}"
      end

      def purge(vizs)
        return unless vizs.count > 0
        keys = vizs.map { |v| [key(v.id, false), key(v.id, true)] }.flatten
        redis.del keys
      end

      private

      VIZJSON_VERSION_KEY = {
        2 => '',
        3 => '3'
      }.freeze

      def redis
        @redis
      end

    end
  end
end
