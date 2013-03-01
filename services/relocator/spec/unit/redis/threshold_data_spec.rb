# encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require_relative '../../../redis/threshold_data'

include CartoDB::Relocator

describe ThresholdData do
  before do
    @old_user_id    = 2
    @new_user_id    = rand(999)
    json_data       = File.open(File.join(File.dirname(__FILE__), '..', '..',
                      'fixtures', 'thresholds.json')).readlines.join
    @sample_data    = JSON.parse(json_data)
    @redis          = Redis.new(db: 8)
    @threshold_data = ThresholdData.new(@new_user_id, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'transforms the keys changing user_id' do
      @sample_data.keys.each { |key| key.must_match /users:#{@old_user_id}/ }

      data = @threshold_data.transform(@sample_data)

      data.keys.each { |key| key.wont_match /users:#{@old_user_id}:/ }
      data.keys.each { |key| key.must_match /users:#{@new_user_id}:/ }
    end
  end #transform

  describe '#load' do
    it 'loads the data into redis' do
      @redis.keys("*users:#{@new_user_id}:*").must_be_empty
      @threshold_data.load(@sample_data)
      @redis.keys("*users:#{@new_user_id}:*").wont_be_empty
    end
  end #load
end # Relocator::Redis::Loader

