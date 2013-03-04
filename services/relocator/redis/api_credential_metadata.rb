# encoding: utf-8
require 'redis'
require_relative './key_master'
require_relative '../relocator'

module CartoDB
  module Relocator
    class APICredentialMetadata
      def initialize(user_id, redis=nil, key_master=nil)
        @user_id    = user_id
        @redis      = redis       || default_redis
        @key_master = key_master  || Redis::KeyMaster.new
      end #initialize

      def dump(tokens=[])
        tokens.inject(Hash.new) do |memo, token|
          key = key_master.api_credential(token)
          memo.store(key, redis.hgetall(key))
          memo
        end
      end #dump

      def load(api_credential_metadata={})
        transform(api_credential_metadata).each do |key, data| 
          redis.hmset key, *data.to_a.flatten
        end
      end #load

      def transform(api_credential_metadata={})
        api_credential_metadata.inject(Hash.new) do |memo, tuple|
          key, value = *tuple
          memo.store(key, value.merge('user_id' => user_id))
          memo
        end
      end #transform

      private

      attr_reader :user_id, :redis, :key_master

      def keys_for(user_id)
        redis.keys(key_master.api_credential(user_id) + '*')
      end #keys_for

      def default_redis
        ::Redis.new(db: REDIS_DATABASES.fetch(:api_credentials))
      end #default_redis
    end # APICredentialMetadata
  end # Reloctor
end # CartoDB

