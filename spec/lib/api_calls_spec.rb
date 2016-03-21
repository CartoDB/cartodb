require 'spec_helper'
require_relative '../../lib/cartodb/stats/api_calls'
require 'helpers/random_names_helper'

describe CartoDB::Stats::APICalls do
  include RandomNamesHelper

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

  describe 'get_api_calls_from_redis_source' do

    before(:each) do
      @api_calls = CartoDB::Stats::APICalls.new
      @username = random_name('user')
      @type = random_name('type')
      @options = { stat_tag: '000d1206-1fed-11e5-9964-080027880ca6' }
    end

    it 'fetches 30 days in inverse order even if there is no data' do
      today = Date.today
      first_expected_day = (today - 29.days).strftime('%Y%m%d')
      last_expected_day = today.strftime('%Y%m%d')
      calls = @api_calls.get_api_calls_from_redis_source('nonexisting_user', 'nonexisting_api_call_type')
      calls.count.should == 30
      calls.each { |day, count|
        count.should == 0
      }
      calls.first[0] = last_expected_day
      calls[last_expected_day].should == 0
      calls[first_expected_day].should == 0
    end

    it 'fetches data' do
      key = @api_calls.redis_api_call_key(@username, @type, @options[:stat_tag])

      # Test data: 3 months, incremental count
      date_to = Date.today + 30.days
      date_from = Date.today - 60.days
      score = 0
      scores = {}
      date_to.downto(date_from) do |date|
        stat_date = date.strftime("%Y%m%d")
        score += 1
        $users_metadata.ZADD(key, score, stat_date).to_i
        scores[stat_date] = score
      end

      calls = @api_calls.get_api_calls_from_redis_source(@username, @type, @options)
      calls.count.should == 30

      date_to = Date.today
      date_from = Date.today - 29.days
      date_to.downto(date_from) do |date|
        stat_date = date.strftime("%Y%m%d")
        calls[stat_date].should eq(scores[stat_date]), "Failed day #{stat_date}, it was #{calls[stat_date]} instead of #{scores[stat_date]}"
      end
    end

    it 'fetches random data from 2 months' do
      key = @api_calls.redis_api_call_key(@username, @type, @options[:stat_tag])

      today = Date.today

      random_data = {}
      random_data[(today - 80.days).strftime("%Y%m%d")] = 1
      random_data[(today - 79.days).strftime("%Y%m%d")] = 2
      random_data[(today - 77.days).strftime("%Y%m%d")] = 3
      random_data[(today - 74.days).strftime("%Y%m%d")] = 4
      random_data[(today - 70.days).strftime("%Y%m%d")] = 5
      random_data[(today - 65.days).strftime("%Y%m%d")] = 6
      random_data[(today - 59.days).strftime("%Y%m%d")] = 7
      random_data[(today - 52.days).strftime("%Y%m%d")] = 8
      random_data[(today - 44.days).strftime("%Y%m%d")] = 9
      random_data[(today - 35.days).strftime("%Y%m%d")] = 10
      random_data[(today - 25.days).strftime("%Y%m%d")] = 11
      random_data[(today - 14.days).strftime("%Y%m%d")] = 12
      random_data[(today - 2.days).strftime("%Y%m%d")] = 13
      random_data[(today + 11.days).strftime("%Y%m%d")] = 14

      random_data.each do |date, score|
        $users_metadata.ZADD(key, score, date).to_i
      end

      requested_days = 60
      date_to = Date.today
      date_from = Date.today - (requested_days - 1).days

      calls = @api_calls.get_api_calls_from_redis_source(@username, @type, @options.merge({from: date_from, to: date_to}))
      calls.count.should == requested_days

      date_to.downto(date_from) do |date|
        stat_date = date.strftime("%Y%m%d")
        calls[stat_date].should eq(random_data.fetch(stat_date, 0)), "Failed day #{stat_date}, it was #{calls[stat_date]} instead of #{random_data[stat_date]}"
      end
    end

    it 'fetches data for one day' do
      key = @api_calls.redis_api_call_key(@username, @type, @options[:stat_tag])

      today = Date.today

      random_data = {}
      random_data[(today - 2.days).strftime("%Y%m%d")] = 7
      random_data[(today - 1.days).strftime("%Y%m%d")] = 13

      random_data.each do |date, score|
        $users_metadata.ZADD(key, score, date).to_i
      end

      chose_date = Date.today - 1.days

      calls = @api_calls.get_api_calls_from_redis_source(@username, @type, @options.merge({from: chose_date, to: chose_date}))
      calls.count.should == 1

      chose_date_key = chose_date.strftime("%Y%m%d")
      calls[chose_date_key].should eq(random_data.fetch(chose_date_key, 0)), "Failed day #{chose_date_key}, it was #{calls[chose_date_key]} instead of #{random_data[chose_date_key]}"
    end

  end
end
