require_relative '../simplecov_helper'
require_relative '../rspec_configuration'
require_relative '../../app/helpers/common_data_redis_cache'
require 'active_support/dependencies/autoload'
require 'active_support/core_ext/numeric'
require 'mock_redis'

describe CommonDataRedisCache do
  it 'handles encoding issues' do
    # visualizations_api_url = "https://common-data.carto.com/api/v1/viz?privacy=public&type=table"
    # cd = CommonData.new(visualizations_api_url)
    # cd.datasets
    string_with_wrong_encoding = "\xc2\xa0".force_encoding('ascii-8bit')
    expected_result = { headers: {}, body: string_with_wrong_encoding }
    @mock_redis = MockRedis.new
    cdrc = CommonDataRedisCache.new(@mock_redis)
    cdrc.set(true, {}, string_with_wrong_encoding).should eq "OK"
    cdrc.get(true).should eq expected_result
  end
end
