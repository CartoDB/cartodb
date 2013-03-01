# encoding: utf-8
require 'redis'
require_relative './key_master'
require_relative '../relocator'

module CartoDB
  module Relocator
    class ThresholdMetadata
      def initialize(user_id, redis=nil, key_master=nil)
        @user_id    = user_id
        @redis      = redis || Redis.new(db: REDIS_DATABASES.fetch(:threshold))
        @key_master = key_master || Redis::KeyMaster.new
      end #initialize

      def dump
        keys_for(user_id).inject(Hash.new) do |memo, key| 
          memo.store(key, redis.get(key))
          memo
        end
      end #dump

      def load(threshold_data={})
        transform(threshold_data).each { |key, value| redis.set(key, value) }
      end #load

      def transform(threshold_data={})
        threshold_data.inject(Hash.new) do |memo, tuple|
          key, value = *tuple
          memo.store(alter(key, user_id), value)
          memo
        end
      end #transform

      private

      attr_reader :user_id, :redis

      def keys_for(user_id)
        redis.keys(key_master.threshold(user_id) + '*')
      end #keys_for

      def alter(key, user_id)
        key.gsub(/users:\d+:/, "users:#{user_id}:")
      end #alter
    end # ThresholdMetadata
  end # Reloctor
end # CartoDB

