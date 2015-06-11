require 'spec_helper'
require_relative '../../lib/cartodb/stats/api_calls'

describe CartoDB::Stats::APICalls do
  describe "Stats API Calls" do
    before(:all) do
      @api_calls = CartoDB::Stats::APICalls.new
        
      @default_date_to = Date.today
      @default_date_from = @default_date_to - 29.days
      @dates = @default_date_to.downto(@default_date_from).map {|d| d.strftime("%Y%m%d")}
      @dates_example_values = {}
      @dates.each do |d|
        @dates_example_values[d] = rand(50)
      end
      @redis_sources_count = CartoDB::Stats::APICalls::REDIS_SOURCES.length
    end

    it "should sum correctly api calls from all sources and return array without date" do
      @api_calls.stubs(:get_old_api_calls).returns(@dates_example_values.values)
      @api_calls.stubs(:get_api_calls_from_redis_source).returns(@dates_example_values)
      expected_total_calls = @dates_example_values.values.map {|v| v * (@redis_sources_count + 1)}
      @api_calls.get_api_calls_without_dates('wadus', {old_api_calls: true}).should == expected_total_calls

    end
    
    it "should sum correctly api calls from all redis sources and return hash with dates" do
      @api_calls.stubs(:get_api_calls_from_redis_source).returns(@dates_example_values)
      expected_total_calls = {}
      @dates_example_values.each do |d, value| 
        expected_total_calls[d] = value * @redis_sources_count
      end
      @api_calls.get_api_calls_with_dates('wadus').should == expected_total_calls
    end
    
    it "should sum correctly api calls from all redis sources and return absolute value" do
      api_calls_value = 3
      @api_calls.stubs(:get_total_api_calls_from_redis_source).returns(api_calls_value)
      expected_total_calls = @redis_sources_count * api_calls_value
      @api_calls.get_total_api_calls('wadus', '123456').should == expected_total_calls
    end

    it "should sum correctly api calls with custom dates from all redis sources and return hash with dates" do
      pending "Find a way to stub only redis call"

      @api_calls.stubs(:get_api_calls_from_redis_source).returns(@dates_example_values)
      expected_total_calls = {}
      @dates_example_values.each do |d, value| 
        expected_total_calls[d] = value * @redis_sources_count
      end
      @api_calls.get_api_calls_with_dates(
        'wadus',
        {
          from: (Date.today - 6.days),
          to: Date.today
        }  
      ).should == expected_total_calls.to_a[0..6].to_h
    end

  end
end
