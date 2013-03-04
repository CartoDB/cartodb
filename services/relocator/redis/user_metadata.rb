# encoding: utf-8
require 'redis'
require_relative './key_master'
require_relative '../relocator'

module CartoDB
  module Relocator
    class UserMetadata
      def initialize(user_id, redis=nil, key_master=nil)
        @user_id    = user_id
        @redis      = redis       || default_redis
        @key_master = key_master  || Redis::KeyMaster.new
      end #initialize

      def dump(username)
        Hash.new.store(key_master.user_metadata(username), redis.hgetall(key))
      end #dump

      def load(user_metadata={})
        transform(user_metadata).each do |key, data| 
          redis.hmset key, *data.to_a.flatten
        end
      end #load

      def transform(user_metadata={})
        Hash[user_metadata.map { |key, data| [key, massage(data)] }]
      end

      private

      attr_reader :user_id, :redis, :key_master

      def massage(data)
        transformed = data.inject(Hash.new) do |memo, tuple|
          key, value = *tuple
          memo.store(key, alter(value, user_id)) if key == 'database_name'
          memo
        end

        data.merge transformed
      end #massage

      def alter(database_name, user_id)
        database_name.gsub(/_\d+_db/, "_#{user_id}_db")
      end #alter

      def default_redis
        ::Redis.new(db: REDIS_DATABASES.fetch(:users_metadata))
      end #default_redis
    end # UserMetadata
  end # Reloctor
end # CartoDB

