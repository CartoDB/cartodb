# encoding: utf-8

require_relative '../../lib/service_usage_metrics'
require 'mock_redis'
require_relative '../../../../spec/rspec_configuration'

describe CartoDB::ServiceUsageMetrics do
  describe 'Read quota info from redis with and without zero padding' do

    before(:each) do
      @redis_mock = MockRedis.new
      @usage_metrics = CartoDB::ServiceUsageMetrics.new('rtorre', 'team', @redis_mock)
      @usage_metrics.stubs(:check_valid_data)
    end

    it 'reads standard zero padded keys' do
      @redis_mock.zincrby('org:team:here_isolines:isolines_generated:201606', 1543, '01')
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 1)).should eq 1543
    end

    it 'reads as well wrongly stored non-padded keys' do
      @redis_mock.zincrby('org:team:here_isolines:isolines_generated:201606', 1543, '1')
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 1)).should eq 1543
    end

    it "sums the amounts from both keys" do
      @redis_mock.zincrby('org:team:here_isolines:isolines_generated:201606', 10, '01')
      @redis_mock.zincrby('org:team:here_isolines:isolines_generated:201606', 20, '1')
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 1)).should eq 30
    end

    it "does not request redis twice when there's no need" do
      @redis_mock.expects(:zscore).once.with('org:team:here_isolines:isolines_generated:201606', '20').returns(3141592)
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 20)).should eq 3141592
    end

    it "returns zero when there's no consumption" do
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 20)).should eq 0
    end
  end
end
