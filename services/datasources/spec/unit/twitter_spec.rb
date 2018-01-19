# encoding: utf-8

require_relative '../../lib/datasources'
require_relative '../doubles/organization'
require_relative '../doubles/user'
require_relative '../doubles/search_tweet'
require_relative '../doubles/data_import'
require_relative '../../../../lib/cartodb/logger'

include CartoDB::Datasources

describe Search::Twitter do

  def get_config
    {
      'auth_required' => false,
      'username'      => '',
      'password'      => '',
      'search_url'    => 'http://fakeurl.carto',
    }
  end #get_config

  before(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#filters' do
    it 'tests max and total results filters' do
      big_quota = 123456
      user = CartoDB::Datasources::Doubles::User.new({
        twitter_datasource_quota: big_quota
      })
      twitter_datasource = Search::Twitter.get_new(get_config, user)

      maxresults_filter = twitter_datasource.send :build_maxresults_field, user
      maxresults_filter.should eq CartoDB::TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
      totalresults_filter = twitter_datasource.send :build_total_results_field, user
      totalresults_filter.should eq big_quota

      small_quota = 13
      user = CartoDB::Datasources::Doubles::User.new({
        twitter_datasource_quota: small_quota,
        soft_twitter_datasource_limit: false
      })
      twitter_datasource = Search::Twitter.get_new(get_config, user)
      maxresults_filter = twitter_datasource.send :build_maxresults_field, user
      maxresults_filter.should eq small_quota
      totalresults_filter = twitter_datasource.send :build_total_results_field, user
      totalresults_filter.should eq small_quota

      user = CartoDB::Datasources::Doubles::User.new({
        twitter_datasource_quota: small_quota,
        soft_twitter_datasource_limit: true
      })
      maxresults_filter = twitter_datasource.send :build_maxresults_field, user
      maxresults_filter.should eq CartoDB::TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
      totalresults_filter = twitter_datasource.send :build_total_results_field, user
      totalresults_filter.should eq Search::Twitter::NO_TOTAL_RESULTS
    end

    it 'tests category filters' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture

      expected_output_terms = [
          {
            Search::Twitter::CATEGORY_NAME_KEY  => 'Category 1',
            Search::Twitter::CATEGORY_TERMS_KEY => '(uno OR @dos OR #tres) (has:geo OR has:profile_geo)'
          },
          {
            Search::Twitter::CATEGORY_NAME_KEY  => 'Category 2',
            Search::Twitter::CATEGORY_TERMS_KEY => '(aaa OR bbb) (has:geo OR has:profile_geo)'
          }
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms

      output.should eq expected_output_terms
    end

    it 'tests search term cut if too many' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = {
        categories: [
          {
            category: 'Category 1',
            terms:    Array(1..35)
          }
        ]
      }

      expected_output_terms = [
          {
              Search::Twitter::CATEGORY_NAME_KEY  => 'Category 1',
              Search::Twitter::CATEGORY_TERMS_KEY => '(1 OR 2 OR 3 OR 4 OR 5 OR 6 OR 7 OR 8 OR 9 OR 10 OR 11 OR 12 OR 13 OR 14 OR 15 OR 16 OR 17 OR 18 OR 19 OR 20 OR 21 OR 22 OR 23 OR 24 OR 25 OR 26 OR 27 OR 28 OR 29) (has:geo OR has:profile_geo)'
          },
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms
      output.should eq expected_output_terms
    end

    it 'tests search term cut if too big (even if amount is ok)' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = {
          categories: [
              {
                  category: 'Category 1',
                  terms:    ['wadus1', 'wadus2', 'wadus3' * 500]
              }
          ]
      }

      expect {
        output = twitter_datasource.send :build_queries_from_fields, input_terms

      }.to raise_error ParameterError
    end


    it 'tests date filters' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_dates = dates_fixture

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'from'
      output.should eq '201403031349'

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'to'
      output.should eq '201403041159'

      expect {
        twitter_datasource.send :build_date_from_fields, input_dates, 'wadus'
      }.to raise_error ParameterError


      current_time = Time.now.utc
      output = twitter_datasource.send :build_date_from_fields, {
        dates: {
          toDate:   current_time.strftime("%Y-%m-%d"),
          toHour:   current_time.hour + 1,  # Set into the future
          toMin:    current_time.min
        }
      }, 'to'
      output.should eq nil

    end

    it 'tests twitter search integration (without conversion to CSV)' do
      # This test bridges lots of internal calls to simulate only up until twitter search call and results
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurl\.carto/) do |request|
        accept = (request.options[:headers]||{})['Accept'] || 'application/json'
        format = accept.split(',').first

        if request.options[:params][:next].nil?
          body = data_from_file('sample_tweets.json')
        else
          body = data_from_file('sample_tweets_2.json')
        end

        Typhoeus::Response.new(
            code: 200,
            headers: { 'Content-Type' => format },
            body: body
        )
      end

      twitter_api_config = twitter_datasource.send :search_api_config
      twitter_api = CartoDB::TwitterSearch::SearchAPI.new(twitter_api_config)

      fields = {
        categories: input_terms[:categories],
        dates:      input_dates[:dates]
      }
      filters = {
          Search::Twitter::FILTER_CATEGORIES =>    (twitter_datasource.send :build_queries_from_fields, fields),
          Search::Twitter::FILTER_FROMDATE =>      (twitter_datasource.send :build_date_from_fields, fields, 'from'),
          Search::Twitter::FILTER_TODATE =>        (twitter_datasource.send :build_date_from_fields, fields, 'to'),
          Search::Twitter::FILTER_MAXRESULTS =>    500,
          Search::Twitter::FILTER_TOTAL_RESULTS => Search::Twitter::NO_TOTAL_RESULTS
      }

      category = {
          name:  input_terms[:categories].first[:category],
          terms: input_terms[:categories].first[:terms],
      }
      csv_dumper = twitter_datasource.send :csv_dumper
      csv_dumper.begin_dump(input_terms[:categories][0][:category])
      csv_dumper.begin_dump(input_terms[:categories][1][:category])
      csv_dumper.additional_fields = { category[:name] => category }

      output = twitter_datasource.send :search_by_category, twitter_api, filters, category

      # 2 pages of 10 results per category search
      output.should eq 20

      csv_dumper.send :destroy_files
    end

    it 'tests stopping search if runs out of quota' do
      # Should equal to sample_tweets_3.json number of results, and always >= 10 (because is Gnip's minimum)
      remaining_tweets_quota = 11

      user_mock = CartoDB::Datasources::Doubles::User.new(
        twitter_datasource_quota: remaining_tweets_quota
      )
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurl\.carto/) do |request|
        accept = (request.options[:headers]||{})['Accept'] || 'application/json'
        format = accept.split(',').first

        if request.options[:params][:next].nil?
          # This dataset has 11 items and a "next"
          body = data_from_file('sample_tweets_3.json')
        else
          body = data_from_file('sample_tweets_2.json')
        end

        Typhoeus::Response.new(
            code: 200,
            headers: { 'Content-Type' => format },
            body: body
        )
      end

      twitter_api_config = twitter_datasource.send :search_api_config
      twitter_api = CartoDB::TwitterSearch::SearchAPI.new(twitter_api_config)

      fields = {
          categories: input_terms[:categories],
          dates:      input_dates[:dates]
      }
      filters = {
          Search::Twitter::FILTER_CATEGORIES =>    (twitter_datasource.send :build_queries_from_fields, fields),
          Search::Twitter::FILTER_FROMDATE =>      (twitter_datasource.send :build_date_from_fields, fields, 'from'),
          Search::Twitter::FILTER_TODATE =>        (twitter_datasource.send :build_date_from_fields, fields, 'to'),
          Search::Twitter::FILTER_MAXRESULTS =>    500,
          Search::Twitter::FILTER_TOTAL_RESULTS => Search::Twitter::NO_TOTAL_RESULTS
      }

      category = {
          name:  input_terms[:categories].first[:category],
          terms: input_terms[:categories].first[:terms],
      }
      csv_dumper = twitter_datasource.send :csv_dumper
      csv_dumper.begin_dump(input_terms[:categories][0][:category])
      csv_dumper.begin_dump(input_terms[:categories][1][:category])
      csv_dumper.additional_fields = { category[:name] => category }

      output = twitter_datasource.send :search_by_category, twitter_api, filters, category

      output.should eq remaining_tweets_quota

      csv_dumper.send :destroy_files
    end

    it 'tests user limits on datasource usage' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      # Service enabled tests
      result = twitter_datasource.send :is_service_enabled?, CartoDB::Datasources::Doubles::User.new({
        has_org: true,
        twitter_datasource_enabled: true,
        org_twitter_datasource_enabled: true
      })
      result.should eq true

      result = twitter_datasource.send :is_service_enabled?, CartoDB::Datasources::Doubles::User.new({
        has_org: true,
        twitter_datasource_enabled: false,
        org_twitter_datasource_enabled: true
      })
      result.should eq false

      result = twitter_datasource.send :is_service_enabled?, CartoDB::Datasources::Doubles::User.new({
        twitter_datasource_enabled: true,
      })
      result.should eq true

      result = twitter_datasource.send :is_service_enabled?, CartoDB::Datasources::Doubles::User.new({
      twitter_datasource_enabled: false,
      })
      result.should eq false

      # Quota & soft limit tests
      result = twitter_datasource.send :has_enough_quota?, CartoDB::Datasources::Doubles::User.new({
        soft_twitter_datasource_limit: false,
        twitter_datasource_quota: 10,
      })
      result.should eq true

      result = twitter_datasource.send :has_enough_quota?, CartoDB::Datasources::Doubles::User.new({
        soft_twitter_datasource_limit: true,
        twitter_datasource_quota: 0,
      })
      result.should eq true

      result = twitter_datasource.send :has_enough_quota?, CartoDB::Datasources::Doubles::User.new({
        soft_twitter_datasource_limit: false,
        twitter_datasource_quota: 0,
      })
      result.should eq false
    end

    it 'checks terms sanitize method' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      terms = [ 'a', ' b', 'c ', ' d ', ' e f', 'g h ', ' i j ', ' 1 2 3 4 ', ' ' ]
      terms_expected = [ 'a', 'b', 'c', 'd', '"e f"', '"g h"', '"i j"', '"1 2 3 4"' ]

      result = twitter_datasource.send :sanitize_terms, terms
      result.should eq terms_expected
    end

  end

  protected

  def terms_fixture
    {
      categories: [
        {
          category: 'Category 1',
          terms:    ['uno', '@dos', '#tres']
        },
        {
          category: 'Category 2',
          terms:    ['aaa', 'bbb']
        }
      ]
    }
  end

  def dates_fixture
    {
      dates: {
        fromDate: '2014-03-03',
        fromHour: '13',
        fromMin:  '49',
        toDate:   '2014-03-04',
        toHour:   '11',
        toMin:    '59'
      }
    }
  end

  def data_from_file(filename, fullpath=false)
    if fullpath
      File.read(filename)
    else
      File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
    end
  end

end
