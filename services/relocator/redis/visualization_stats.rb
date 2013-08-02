# encoding: utf-8
require 'redis'
require_relative './key_master'
require_relative '../relocator'

module CartoDB
  module Relocator
    class VisualizationStats
      def initialize(username=nil, redis=nil, key_master=nil)
        @username   = username
        @key_master = key_master || Redis::KeyMaster.new

        db          = REDIS_DATABASES.fetch(:visualization_stats)
        @redis      = redis || ::Redis.new(db: db)
      end #initialize

      def dump
        keys_for(username).inject(Hash.new) do |memo, key|
          memo.store(key, redis.zrange(key, 0, -1, with_scores: true))
          memo
        end
      end #dump

      def keys_for(username)
        redis.keys(key_master.visualization_stats(username) + '*')
      end #keys_for

      def load(visualization_stats={})
        transform(visualization_stats).each do |key, data| 
          data.each_slice(2) { |tuple| redis.zadd(key, *tuple.reverse) }
        end
      end #load

      def transform(visualization_stats)
        Hash[ visualization_stats.map { |key, data| [alter(key), data] } ]
      end #transform

      def username_at_origin(key)
        key.split(':').at(1)
      end #username_at_origin

      private

      attr_reader :username, :redis, :key_master

      def alter(key)
        parts     = key.split(':')
        parts[1]  = username
        parts.join(':')
      end #alter
    end #VisualizationStats
  end # Relocator
end # CartoDB

