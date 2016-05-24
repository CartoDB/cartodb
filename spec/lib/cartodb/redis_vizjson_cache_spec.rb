require 'spec_helper_min'
require_relative '../../../lib/cartodb/redis_vizjson_cache'
require 'mock_redis'
require 'ostruct'
require_relative '../../support/redis_test_doubles'
require_relative '../../../lib/carto/uuidhelper'

describe CartoDB::Visualization::RedisVizjsonCache do
  include Carto::UUIDHelper

  # http and https
  PROTOCOL_KEYS_COUNT = 2

  # v2 and v3 and v3 forcing named/anonymous maps
  VIZJSON_VERSION_COUNT = 4

  KEYS_PER_VISUALIZATION = PROTOCOL_KEYS_COUNT * VIZJSON_VERSION_COUNT

  let(:redis_spy) { RedisDoubles::RedisSpy.new }
  let(:redis_mock) { MockRedis.new }

  describe '#cached' do
    let(:fake_vizjson) { { test: 1 } }

    it 'caches by id' do
      visualization_id = random_uuid
      cache = CartoDB::Visualization::RedisVizjsonCache.new
      # Not cached
      returned = cache.cached(visualization_id) { fake_vizjson }
      returned.should eq fake_vizjson
      # Cached
      cache.cached(visualization_id) { fake_vizjson2 }
      returned.should eq fake_vizjson
    end
  end

  describe '#invalidate' do
    it 'deletes all keys from a visualization' do
      visualization_id = random_uuid
      cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_spy)
      cache.invalidate(visualization_id)

      deleted = redis_spy.deleted

      deleted.count.should eq KEYS_PER_VISUALIZATION

      deleted.count { |d| d.match(/http$/) }.should eq VIZJSON_VERSION_COUNT
      deleted.count { |d| d.match(/https$/) }.should eq VIZJSON_VERSION_COUNT
      deleted.count { |d| d.match(/#{visualization_id}/) }.should eq KEYS_PER_VISUALIZATION
    end
  end

  describe '#purge' do
    it 'deletes all keys from all visualizations from redis' do
      vs = [OpenStruct.new(id: random_uuid), OpenStruct.new(id: random_uuid)]
      cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_spy)
      cache.purge(vs)

      deleted = redis_spy.deleted

      deleted.count.should eq vs.count * KEYS_PER_VISUALIZATION

      deleted.count { |d| d.match(/http$/) }.should eq vs.count * VIZJSON_VERSION_COUNT
      deleted.count { |d| d.match(/https$/) }.should eq vs.count * VIZJSON_VERSION_COUNT

      deleted.count { |d| d.match(/#{vs[0].id}/) }.should eq KEYS_PER_VISUALIZATION
      deleted.count { |d| d.match(/#{vs[1].id}/) }.should eq KEYS_PER_VISUALIZATION
    end
  end
end
