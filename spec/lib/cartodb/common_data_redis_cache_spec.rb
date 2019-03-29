require_relative '../../../app/helpers/common_data_redis_cache'
require_relative '../../spec_helper_min'
require 'mock_redis'

describe CommonDataRedisCache do
  it 'handles encoding issues' do
    string_with_wrong_encoding = "\xc2\xa0".force_encoding('ascii-8bit')
    expected_result = { headers: {}, body: string_with_wrong_encoding }
    @mock_redis = MockRedis.new
    cdrc = CommonDataRedisCache.new(@mock_redis)
    cdrc.set(true, {}, string_with_wrong_encoding).should eq "OK"
    cdrc.get(true).should eq expected_result
  end
end
