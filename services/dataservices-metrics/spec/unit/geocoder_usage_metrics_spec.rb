# encoding: utf-8

require_relative '../../lib/geocoder_usage_metrics'

describe CartoDB::GeocoderUsageMetrics do

  describe :check_valid_data do

    before(:each) do
      @geocoder_usage_metrics = CartoDB::GeocoderUsageMetrics.new('foo', nil, nil)
    end

    it 'passes when fed with a positive integer' do
      @geocoder_usage_metrics.send(
        :check_valid_data,
        :geocoder_internal,
        :total_requests,
        42).should eq nil
    end

    it 'validates that the amount passed cannot be nil' do
      expect {
        @geocoder_usage_metrics.send(
          :check_valid_data,
          :geocoder_internal,
          :total_requests,
          nil)
      }.to raise_exception(ArgumentError, 'Invalid geocoder metric amount')
    end

    it 'validates that the amount passed cannot be negative' do
      expect {
        @geocoder_usage_metrics.send(
          :check_valid_data,
          :geocoder_internal,
          :total_requests,
          -42)
      }.to raise_exception(ArgumentError, 'Invalid geocoder metric amount')
    end

    it 'validates that the amount passed cannot be zero' do
      expect {
        @geocoder_usage_metrics.send(
          :check_valid_data,
          :geocoder_internal,
          :total_requests,
          0)
      }.to raise_exception(ArgumentError, 'Invalid geocoder metric amount')
    end

  end

end
