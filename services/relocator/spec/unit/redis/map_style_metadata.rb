# encoding: utf-8
require 'minitest/autorun'
require 'json'
require 'redis'
require_relative '../../../redis/map_style_metadata'

include CartoDB::Relocator

describe MapStyleMetadata do
  before do
    @old_user_id        = 2
    @new_user_id        = rand(100) + 100
    json_metadata       = File.open(File.join(File.dirname(__FILE__), '..', '..',
                          'fixtures', 'map_styles_metadata.json'))
                          .readlines.join
    @sample             = JSON.parse(json_metadata)
    @redis              = Redis.new(db: 8)
    @map_style_metadata = MapStyleMetadata.new(@new_user_id, @redis)
    @redis.flushdb  
  end

  describe '#transform' do
    it 'transforms the keys changing user_id' do
      @sample.keys.each { |key| key.must_match /user_#{@old_user_id}_db/ }

      metadata = @map_style_metadata.transform(@sample)

      metadata.keys.each { |key| key.wont_match /user_#{@old_user_id}_db/ }
      metadata.keys.each { |key| key.must_match /user_#{@new_user_id}_db/ }
    end

    it 'changes the databasename in the styles, if that param is set' do
      @sample.values.each do |value| 
        value.must_match /user_#{@old_user_id}_db/ if value =~ /dbname/
      end

      metadata = @map_style_metadata.transform(@sample)

      metadata.values.each do |value|
        value.wont_match /user_#{@old_user_id}_db/
      end

      metadata.values.each do |value| 
        value.must_match /user_#{@new_user_id}_db/ if value =~ /dbname/
      end
    end
  end #transform

  describe '#load' do
    it 'loads the metadata into redis' do
      @redis.keys("*user_#{@new_user_id}_db*").must_be_empty
      @map_style_metadata.load(@sample)
      @redis.keys("*user_#{@new_user_id}_db*").wont_be_empty
    end
  end #load
end # Relocator::Redis::Loader
