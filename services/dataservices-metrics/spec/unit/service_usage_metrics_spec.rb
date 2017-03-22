# encoding: utf-8

require_relative '../../lib/service_usage_metrics'
require 'mock_redis'
require_relative '../../../../spec/rspec_configuration'

describe CartoDB::ServiceUsageMetrics do

  class DummyServiceUsageMetrics < CartoDB::ServiceUsageMetrics
    VALID_METRICS = [ :dummy_metric ]
    VALID_SERVICES = [ :dummy_service ]

    def check_valid_data(service, metric)
      raise ArgumentError.new('Invalid service') unless VALID_SERVICES.include?(service)
      raise ArgumentError.new('Invalid metric') unless VALID_METRICS.include?(metric)
    end
  end

  before(:each) do
    @redis_mock = MockRedis.new
    @usage_metrics = DummyServiceUsageMetrics.new('rtorre', 'team', @redis_mock)
  end

  describe 'Read quota info from redis with zero padding' do

    it 'reads standard zero padded keys' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201606', 1543, '01')
      @usage_metrics.get(:dummy_service, :dummy_metric, Date.new(2016, 6, 1)).should eq 1543
    end

    it "does not request redis twice when there's no need" do
      @redis_mock.expects(:zscore).once.with('org:team:dummy_service:dummy_metric:201606', '20').returns(3141592)
      @usage_metrics.get(:dummy_service, :dummy_metric, Date.new(2016, 6, 20)).should eq 3141592
    end

    it "returns zero when there's no consumption" do
      @usage_metrics.get(:dummy_service, :dummy_metric, Date.new(2016, 6, 20)).should eq 0
    end
  end

  describe :assert_valid_amount do
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

    it 'validates that the amount passed can actually be zero' do
      @usage_metrics.send(:assert_valid_amount, 0).should eq nil
    end
  end

  describe :incr do
    it 'validates that the amount passed can actually be zero' do
      @usage_metrics.incr(:dummy_service, :dummy_metric, _amount = 0)
      @usage_metrics.get(:dummy_service, :dummy_metric).should eq 0
    end
  end

  describe :get_date_range do
    it 'gets a sum of the zscores stored in a given date range' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=1, _day='20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=2, _day='21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=3, _day='22')

      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 03, 20),
                                    Date.new(2017, 03, 22)).should eq 6
    end

    it 'gracefully deals with days without record' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=1, _day='20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=2, _day='21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=3, _day='22')

      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 03, 15),
                                    Date.new(2017, 03, 22)).should eq 6
    end

    it 'gracefully deals with months not stored in redis' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=1, _day='20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=2, _day='21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount=3, _day='22')

      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 02, 15),
                                    Date.new(2017, 03, 22)).should eq 6
    end

    it 'performs just one request/month to redis' do
      @redis_mock.expects(:zrange).twice
      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 02, 15),
                                    Date.new(2017, 03, 24))
    end
  end
end
