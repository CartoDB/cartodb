# encoding: utf-8
require 'redis'
require_relative './key_master'
require_relative '../relocator'

module CartoDB
  module Relocator
    class MapStyleMetadata
      def initialize(user_id, redis=nil, key_master=nil)
        @user_id    = user_id
        @redis      = redis || ::Redis.new(db: REDIS_DATABASES.fetch(:map_style))
        @key_master = key_master || Redis::KeyMaster.new
      end #initialize

      def dump
        keys_for(user_id).inject(Hash.new) do |memo, key| 
          memo.store(key, redis.get(key))
          memo
        end
      end #dump

      def load(map_style_data={})
        transform(map_style_data).each { |key, value| redis.set(key, value) }
      end #load

      def transform(map_style_data={})
        map_style_data.inject(Hash.new) do |memo, tuple|
          key, value = *tuple
          memo.store(alter(key, user_id), alter(value, user_id))
          memo
        end
      end #transform

      private

      attr_reader :user_id, :redis, :key_master

      def keys_for(user_id)
        redis.keys(key_master.map_style_metadata(user_id) + '*')
      end #keys_for

      def alter(key, user_id)
        key.gsub(/user_\d+_db/, "user_#{user_id}_db")
      end #alter
    end # MapStyleMetadata
  end # Reloctor
end # CartoDB

