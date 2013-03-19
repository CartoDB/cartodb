# encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require 'ostruct'
require_relative '../../../redis/user_metadata'

include CartoDB::Relocator

describe UserMetadata do
  before do
    @old_user_id    = 2
    @user           = OpenStruct.new(
                        id:       rand(100) + 100,
                        username: 'staging20'
                      )
    json_data       = File.open(File.join(File.dirname(__FILE__), '..', '..',
                      'fixtures', 'users_metadata.json')).readlines.join
    @sample_data    = JSON.parse(json_data)
    @redis          = Redis.new(db: 8)
    @user_metadata  = UserMetadata.new(@user, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'transforms the database_name key in the data' do
      user_data = @sample_data.values.first
      user_data.fetch('database_name').must_match(/_#{@old_user_id}_db/)

      user_data = @user_metadata.transform(@sample_data).values.first
      user_data.fetch('database_name').must_match(/_#{@user.id}_db/)
    end

    it 'alters the key using the username of the user' do
      first_key = @sample_data.first.first
      first_key.must_match /staging20/

      @user.username = 'changed'

      first_key = @user_metadata.transform(@sample_data).first.first
      first_key.must_match /changed/
    end
  end #transform

  describe '#load' do
    it 'loads the data into redis' do
      @redis.hget("rails:users:staging20", "database_name")
        .wont_match("_#{@user.id}_")

      @user_metadata.load(@sample_data)

      @redis.hget("rails:users:staging20", "database_name")
        .must_match("_#{@user.id}_")
    end
  end #load
end # Relocator::Redis::Loader

