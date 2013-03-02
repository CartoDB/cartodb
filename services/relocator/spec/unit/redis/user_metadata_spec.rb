#encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require_relative '../../../redis/user_metadata'

include CartoDB::Relocator

describe UserMetadata do
  before do
    @old_user_id    = 2
    @new_user_id    = rand(100) + 100
    json_data       = File.open(File.join(File.dirname(__FILE__), '..', '..',
                      'fixtures', 'users_metadata.json')).readlines.join
    @sample_data    = JSON.parse(json_data)
    @redis          = Redis.new(db: 8)
    @user_metadata  = UserMetadata.new(@new_user_id, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'transforms the database_name key in the data' do
      user_data = @sample_data.values.first
      user_data.fetch('database_name').must_match(/_#{@old_user_id}_db/)

      @user_metadata.transform(@sample_data)

      user_data = @user_metadata.transform(@sample_data).values.first
      user_data.fetch('database_name').must_match(/_#{@new_user_id}_db/)
    end
  end #transform

  describe '#load' do
    it 'loads the data into redis' do
      @redis.hget("rails:users:staging20", "database_name")
        .wont_match("_#{@new_user_id}_")

      @user_metadata.load(@sample_data)

      @redis.hget("rails:users:staging20", "database_name")
        .must_match("_#{@new_user_id}_")
    end
  end #load
end # Relocator::Redis::Loader

