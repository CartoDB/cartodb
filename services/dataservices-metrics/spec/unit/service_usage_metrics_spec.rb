# encoding: utf-8

require_relative '../../lib/service_usage_metrics'
require 'mock_redis'
require_relative '../../../../spec/rspec_configuration'

describe CartoDB::ServiceUsageMetrics do
  describe 'Read quota info from redis with zero padding' do

    before(:each) do
      @redis_mock = MockRedis.new
      @usage_metrics = CartoDB::ServiceUsageMetrics.new('rtorre', 'team', @redis_mock)
      @usage_metrics.stubs(:check_valid_data)
    end

    it 'reads standard zero padded keys' do
      @redis_mock.zincrby('org:team:here_isolines:isolines_generated:201606', 1543, '01')
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 1)).should eq 1543
    end

    it "does not request redis twice when there's no need" do
      @redis_mock.expects(:zscore).once.with('org:team:here_isolines:isolines_generated:201606', '20').returns(3141592)
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 20)).should eq 3141592
    end

    it "returns zero when there's no consumption" do
      @usage_metrics.get('here_isolines', 'isolines_generated', Date.new(2016, 6, 20)).should eq 0
    end
  end

  describe :assert_valid_amount do
    before(:each) do
      @redis_mock = MockRedis.new
      @usage_metrics = CartoDB::ServiceUsageMetrics.new('rtorre', 'team', @redis_mock)
      @usage_metrics.stubs(:check_valid_data)
    end

    it 'passes when fed with a positive integer' do
      @usage_metrics.send(:assert_valid_amount, 42).should eq nil
    end

    it 'validates that the amount passed cannot be nil' do
      expect {
        @usage_metrics.send(:assert_valid_amount, nil)
      }.to raise_exception(ArgumentError, 'Invalid metric amount')
    end

    it 'validates that the amount passed cannot be negative' do
      expect {
        @usage_metrics.send(:assert_valid_amount, -42)
      }.to raise_exception(ArgumentError, 'Invalid metric amount')
    end

    it 'validates that the amount passed cannot be zero' do
      expect {
        @usage_metrics.send(:assert_valid_amount, 0)
      }.to raise_exception(ArgumentError, 'Invalid metric amount')
    end
  end

end
