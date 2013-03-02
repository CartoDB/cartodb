# encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require_relative '../../../redis/table_metadata'

include CartoDB::Relocator

describe TableMetadata do
  before do
    @old_user_id        = 2
    @new_user_id        = rand(100) + 100
    json_metadata       = File.open(File.join(File.dirname(__FILE__), '..', '..',
                          'fixtures', 'tables_metadata.json'))
                          .readlines.join
    @sample             = JSON.parse(json_metadata)
    @redis              = Redis.new(db: 8)
    @table_metadata     = TableMetadata.new(@new_user_id, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'transforms the keys changing user_id' do
      @sample.keys.each { |key| key.must_match /user_#{@old_user_id}_db/ }

      metadata = @table_metadata.transform(@sample)

      metadata.keys.each { |key| key.wont_match /user_#{@old_user_id}_db/ }
      metadata.keys.each { |key| key.must_match /user_#{@new_user_id}_db/ }
    end

    it 'changes the user_id in the data' do
      @sample.values.first.fetch('user_id').must_match(/#{@old_user_id}/)

      metadata = @table_metadata.transform(@sample).values.first

      metadata.fetch('user_id').to_s.wont_match(/#{@old_user_id}/)
      metadata.fetch('user_id').to_s.must_match(/#{@new_user_id}/)
    end
  end #transform

  describe '#load' do
    it 'loads the metadata into redis' do
      @redis.keys("*user_#{@new_user_id}_db*").must_be_empty
      @table_metadata.load(@sample)
      @redis.keys("*user_#{@new_user_id}_db*").wont_be_empty
    end
  end #load
end # Relocator::Redis::Loader

