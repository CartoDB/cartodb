# encoding: utf-8
require 'minitest/autorun'
require 'redis'

require_relative '../../../redis/dumper'

include CartoDB

describe Relocator::Redis::Dumper do
  before do
    @redis = Redis.new
    @redis.select 8
    @redis.flushdb

    @dumper = Relocator::Redis::Dumper.new(@redis)
  end

  describe '#api_credentials_for' do
    it 'returns the api credentials linked to the passed tokens' do
      token1      = 'token1'
      token2      = 'token2'
      key_master  = Relocator::Redis::KeyMaster.new

      @redis.select Relocator::REDIS_DATABASES.fetch(:api_credentials)
      @redis.hset key_master.api_credential(token1), 'name', 'bogus 1'
      @redis.hset key_master.api_credential(token1), 'name', 'bogus 1'

      data = @dumper.api_credentials_for([token1, token2]).values
      data.flat_map(&:values).must_include 'bogus 1'
      data.flat_map(&:values).must_include 'bogus 2'
    end
  end #api_credentials_for
end # Relocator::Redis::Dumper

