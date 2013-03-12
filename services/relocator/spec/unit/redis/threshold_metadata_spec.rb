# encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require_relative '../../../redis/threshold_metadata'

include CartoDB::Relocator

describe ThresholdMetadata do
  before do
    @old_user_id        = 2
    @new_user_id        = rand(100) + 100
    json_metadata       = File.open(File.join(File.dirname(__FILE__), '..', '..',
                          'fixtures', 'thresholds_metadata.json'))
                          .readlines.join
    @sample             = JSON.parse(json_metadata)
    @redis              = Redis.new(db: 8)
    @threshold_metadata = ThresholdMetadata.new(@new_user_id, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'transforms the keys changing user_id' do
      @sample.keys.each { |key| key.must_match /users:#{@old_user_id}/ }

      metadata = @threshold_metadata.transform(@sample)

      metadata.keys.each { |key| key.wont_match /users:#{@old_user_id}:/ }
      metadata.keys.each { |key| key.must_match /users:#{@new_user_id}:/ }
    end
  end #transform

  describe '#load' do
    it 'loads the metadata into redis' do
      @redis.keys("*users:#{@new_user_id}:*").must_be_empty
      @threshold_metadata.load(@sample)
      @redis.keys("*users:#{@new_user_id}:*").wont_be_empty
    end
  end #load
end # Relocator::Redis::Loader

