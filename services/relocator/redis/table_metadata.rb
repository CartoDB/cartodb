# encoding: utf-8
require 'redis'
require_relative './key_master'
require_relative '../relocator'

module CartoDB
  module Relocator
    class TableMetadata
      def initialize(user_id, redis=nil, key_master=nil)
        @user_id    = user_id
        @redis      = redis || ::Redis.new(db: REDIS_DATABASES.fetch(:tables_metadata))
        @key_master = key_master || Redis::KeyMaster.new
      end #initialize

      def dump(database_name)
        tables_in(database_name).inject(Hash.new) do |memo, table_name|
          key = key_master.table_metadata(database_name, table_name)
          memo.store(key, redis.hgetall(key))
          memo
        end
      end #dump

      def load(table_metadata={})
        transform(table_metadata).each do |key, data| 
          redis.hmset key, *data.to_a.flatten
        end
      end #load

      def transform(table_metadata={})
        table_metadata.inject(Hash.new) do |memo, tuple|
          key, value = *tuple
          memo.store(alter(key, user_id), value.merge('user_id' => user_id))
          memo
        end
      end #transform

      private

      attr_reader :user_id, :redis, :key_master

      def tables_in(database_name)
        redis.keys(key_master.database_metadata(database_name) + '*')
      end #tables_in

      def keys_for(user_id)
        redis.keys(key_master.table(user_id) + '*')
      end #keys_for

      def alter(key, user_id)
        key.gsub(/user_\d+_db/, "user_#{user_id}_db")
      end #alter
    end # TableMetadata
  end # Reloctor
end # CartoDB

