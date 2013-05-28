# encoding: utf-8
require 'json'
require 'redis'
require_relative '../relocator'
require_relative './key_master'

module CartoDB
  module Relocator
    module Redis
      class Dumper
        def initialize(redis=nil)
          @redis      = redis || ::Redis.new
          @key_master = KeyMaster.new
        end #initialize

        def thresholds_for(user_id)
          redis.select Relocator::REDIS_DATABASES.fetch(:threshold)

          threshold_keys_for(user_id).inject(Hash.new) do |memo, key| 
            memo.store(key, redis.get(key))
            memo
          end
        end #thresholds_for

        def tables_metadata_for(database_name)
          redis.select Relocator::REDIS_DATABASES.fetch(:tables_metadata)
          tables_in(database_name).inject(Hash.new) do |memo, table_name|
            key = key_master.table_metadata(database_name, table_name)
            memo.store(key, redis.hgetall(key))
            memo
          end
        end #tables_metadata_for

        def user_metadata_for(username)
          redis.select Relocator::REDIS_DATABASES.fetch(:users_metadata)
          key = key_master.user_metadata(username)
          { key => redis.hgetall(key) }
        end #user_metadata_for

        def api_credentials_for(tokens=[])
          redis.select Relocator::REDIS_DATABASES.fetch(:api_credentials)

          tokens.inject(Hash.new) do |memo, token|
            key = key_master.api_credential(token)
            memo.store(key, redis.hgetall(key))
            memo
          end
        end #api_credentials_for

        private

        attr_accessor :redis, :key_master

        def tables_in(database_name)
          redis.keys(key_master.database_metadata(database_name) + '*').map {|table| table.split(':').last }
        end #tables_in

        def threshold_keys_for(user_id)
          redis.keys(key_master.threshold(user_id) + '*')
        end #thresholds_for
      end # Dumper
    end # Redis
  end # Relocator
end # CartoDB

