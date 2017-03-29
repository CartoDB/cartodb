# encoding: utf-8

require_relative '../../lib/service_usage_metrics'
require 'mock_redis'
require_relative '../../../../spec/rspec_configuration'

describe CartoDB::ServiceUsageMetrics do

  class DummyServiceUsageMetrics < CartoDB::ServiceUsageMetrics
    VALID_METRICS = [:dummy_metric].freeze
    VALID_SERVICES = [:dummy_service].freeze

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

  describe '#get_sum_by_date_range' do
    it 'gets a sum of the zscores stored in a given date range' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 1, _day = '20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 2, _day = '21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 3, _day = '22')
      @usage_metrics.get_sum_by_date_range(:dummy_service,
                                           :dummy_metric,
                                           Date.new(2017, 3, 20),
                                           Date.new(2017, 3, 22)).should eq 6
    end

    it 'gracefully deals with days without record' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 1, _day = '20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 2, _day = '21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 3, _day = '22')
      @usage_metrics.get_sum_by_date_range(:dummy_service,
                                           :dummy_metric,
                                           Date.new(2017, 3, 15),
                                           Date.new(2017, 3, 22)).should eq 6
    end

    it 'gracefully deals with months not stored in redis' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 1, _day = '20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 2, _day = '21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 3, _day = '22')
      @usage_metrics.get_sum_by_date_range(:dummy_service,
                                           :dummy_metric,
                                           Date.new(2017, 2, 15),
                                           Date.new(2017, 3, 22)).should eq 6
    end

    it 'performs just one request/month to redis' do
      @redis_mock.expects(:zrange).twice
      @usage_metrics.get_sum_by_date_range(:dummy_service,
                                           :dummy_metric,
                                           Date.new(2017, 2, 15),
                                           Date.new(2017, 3, 24))
    end

    it 'returns zero when there are no records' do
      @usage_metrics.get_sum_by_date_range(:dummy_service,
                                           :dummy_metric,
                                           Date.new(2017, 2, 15),
                                           Date.new(2017, 3, 22)).should eq 0
    end
  end

  describe '#get_date_range' do
    it 'gets a hash of date => value pairs' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 1, _day = '20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 2, _day = '21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 3, _day = '22')
      expected = {
        Date.new(2017, 3, 20) => 1,
        Date.new(2017, 3, 21) => 2,
        Date.new(2017, 3, 22) => 3
      }
      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 3, 20),
                                    Date.new(2017, 3, 22)).should eq expected
    end

    it 'gracefully deals with days without record' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 1, _day = '20')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 2, _day = '21')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 3, _day = '22')
      expected = {
        Date.new(2017, 3, 18) => 0,
        Date.new(2017, 3, 19) => 0,
        Date.new(2017, 3, 20) => 1,
        Date.new(2017, 3, 21) => 2,
        Date.new(2017, 3, 22) => 3
      }
      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 3, 18),
                                    Date.new(2017, 3, 22)).should eq expected
    end

    it 'gracefully deals with months not stored in redis' do
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 1, _day = '01')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 2, _day = '02')
      @redis_mock.zincrby('org:team:dummy_service:dummy_metric:201703', _amount = 3, _day = '03')
      expected = {
        Date.new(2017, 2, 27) => 0,
        Date.new(2017, 2, 28) => 0,
        Date.new(2017, 3, 1) => 1,
        Date.new(2017, 3, 2) => 2,
        Date.new(2017, 3, 3) => 3
      }
      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 2, 27),
                                    Date.new(2017, 3, 3)).should eq expected
    end

    it 'performs just one request/month to redis' do
      @redis_mock.expects(:zrange).twice
      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 2, 15),
                                    Date.new(2017, 3, 24))
    end

    it 'returns zero when there are no records' do
      expected = {
        Date.new(2017, 2, 28) => 0,
        Date.new(2017, 3, 1) => 0
      }
      @usage_metrics.get_date_range(:dummy_service,
                                    :dummy_metric,
                                    Date.new(2017, 2, 28),
                                    Date.new(2017, 3, 1)).should eq expected
    end
  end
end
