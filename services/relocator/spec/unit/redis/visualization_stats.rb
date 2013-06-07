# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../redis/visualization_stats'

include CartoDB

#$users_metadata.ZSCORE(
#  visualization_stats_key, 
#  date.strftime("%Y%m%d")
#)

describe Relocator::VisualizationStats do
  before do
    @redis          = Redis.new
    @redis.select Relocator::REDIS_DATABASES.fetch(:visualization_stats)
    @redis.flushdb
    @username       = 'bogus'
    @collaborator   = Relocator::VisualizationStats.new(@username, @redis)
  end

  describe '#dump' do
    it 'returns a hash with stats keys, dates and views' do
      generate_sample_data
      data = @collaborator.dump

      data.keys.first.must_match /user:\w+:mapviews/
      data.values.first.must_be_instance_of Array
    end
  end

  describe '#keys_for' do
    it 'returns an array with all visualization stats keys for the user' do
      generate_sample_data
      keys = @collaborator.keys_for(@username)

      keys.length.must_equal 5
      keys.first.must_match /user:\w+:mapviews/
    end
  end

  describe '#load' do
    it 'loads stats into redis' do
      generate_sample_data
      origin      = @collaborator
      data        = origin.dump
      key         = data.keys.first
      date, score = data.fetch(key).first

      @redis.flushdb
      origin.keys_for(@username).length.must_equal 0

      destination = Relocator::VisualizationStats.new(@username, @redis)
      destination.load(data)
      origin.keys_for(@username).length.must_equal 5

      @redis.zscore(key, date).must_equal score
    end
  end #load

  describe '#transform' do
    it 'alters keys with the passed username
    if different from username at origin' do
      generate_sample_data
      origin      = @collaborator
      destination = Relocator::VisualizationStats.new('changed', @redis)
      data              = origin.dump
      transformed_data  = destination.transform(data)

      transformed_data.keys.length.must_equal 5
      transformed_data.keys.first.wont_match /bogus/
      transformed_data.keys.first.must_match /changed/
    end
  end

  describe '#username_at_origin' do
    it 'returns the username at origin from the passed key' do
      sample_key    = 'user:origin_username:mapviews:stat_tag:5'
      collaborator  = Relocator::VisualizationStats.new

      collaborator.username_at_origin(sample_key).must_equal 'origin_username'
    end
  end #username_at_origin

  def generate_sample_data
    5.times do |t|
      key   = "user:#{@username}:mapviews:stat_tag:#{t}"
      score = rand(999)
      @redis.zadd(key, score, Time.now.strftime('%Y%m%d'))
    end
  end #generate_sample_data
end # Relocator::VisualizationStats

