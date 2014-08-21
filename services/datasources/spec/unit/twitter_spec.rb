# encoding: utf-8

require_relative '../../lib/datasources'
require_relative '../doubles/organization'
require_relative '../doubles/user'
require_relative '../doubles/search_tweet'
require_relative '../doubles/data_import'

include CartoDB::Datasources

describe Search::Twitter do

  def get_config
    {
      'auth_required' => false,
      'username'      => '',
      'password'      => '',
      'search_url'    => 'http://fakeurl.cartodb'
    }
  end #get_config

  before(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#filters' do
    it 'tests max and total results filters' do
      twitter_datasource = Search::Twitter.get_new(get_config,Doubles::User.new)

      big_quota = 123456
      user = Doubles::User.new({
        twitter_datasource_quota: big_quota
      })
      maxresults_filter = twitter_datasource.send :build_maxresults_field, user
      maxresults_filter.should eq CartoDB::TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
      totalresults_filter = twitter_datasource.send :build_total_results_field, user
      totalresults_filter.should eq big_quota

      small_quota = 13
      user = Doubles::User.new({
        twitter_datasource_quota: small_quota,
        soft_twitter_datasource_limit: false
      })
      maxresults_filter = twitter_datasource.send :build_maxresults_field, user
      maxresults_filter.should eq small_quota
      totalresults_filter = twitter_datasource.send :build_total_results_field, user
      totalresults_filter.should eq small_quota

      user = Doubles::User.new({
        twitter_datasource_quota: small_quota,
        soft_twitter_datasource_limit: true
      })
      maxresults_filter = twitter_datasource.send :build_maxresults_field, user
      maxresults_filter.should eq CartoDB::TwitterSearch::SearchAPI::MAX_PAGE_RESULTS
      totalresults_filter = twitter_datasource.send :build_total_results_field, user
      totalresults_filter.should eq Search::Twitter::NO_TOTAL_RESULTS
    end

    it 'tests category filters' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture

      expected_output_terms = [
          {
            Search::Twitter::CATEGORY_NAME_KEY  => 'Category 1',
            Search::Twitter::CATEGORY_TERMS_KEY => 'uno has:geo OR @dos has:geo OR #tres has:geo'
          },
          {
            Search::Twitter::CATEGORY_NAME_KEY  => 'Category 2',
            Search::Twitter::CATEGORY_TERMS_KEY => 'aaa has:geo OR bbb has:geo'
          }
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms

      output.should eq expected_output_terms
    end

    it 'tests search term cut if too many' do
      user_mock = Doubles::User.new

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
              Search::Twitter::CATEGORY_TERMS_KEY => '1 has:geo OR 2 has:geo OR 3 has:geo OR 4 has:geo OR 5 has:geo OR 6 has:geo OR 7 has:geo OR 8 has:geo OR 9 has:geo OR 10 has:geo OR 11 has:geo OR 12 has:geo OR 13 has:geo OR 14 has:geo OR 15 has:geo OR 16 has:geo OR 17 has:geo OR 18 has:geo OR 19 has:geo OR 20 has:geo OR 21 has:geo OR 22 has:geo OR 23 has:geo OR 24 has:geo OR 25 has:geo OR 26 has:geo OR 27 has:geo OR 28 has:geo OR 29 has:geo OR 30 has:geo'
          },
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms
      output.should eq expected_output_terms
    end

    it 'tests search term cut if too big (even if amount is ok)' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = {
          categories: [
              {
                  category: 'Category 1',
                  terms:    ['wadus1', 'wadus2', 'wadus3' * 500]
              }
          ]
      }

      expected_output_terms = [
          {
              Search::Twitter::CATEGORY_NAME_KEY  => 'Category 1',
              Search::Twitter::CATEGORY_TERMS_KEY => 'wadus1 has:geo OR wadus2 has:geo'
          },
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms
      output.should eq expected_output_terms
    end


    it 'tests date filters' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_dates = dates_fixture

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'from'
      output.should eq '201403031349'

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'to'
      output.should eq '201403041159'

      expect {
        twitter_datasource.send :build_date_from_fields, input_dates, 'wadus'
      }.to raise_error ParameterError


      current_time = Time.now
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
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurl\.cartodb/) do |request|
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

      twitter_api = twitter_datasource.send :search_api

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

      output = twitter_datasource.send :search_by_category, twitter_api, filters, category, csv_dumper

      # 2 pages of 10 results per category search
      output.should eq 20

      csv_dumper.send :destroy_files
    end

    it 'tests stopping search if runs out of quota' do
      # Should equal to sample_tweets_3.json number of results, and always >= 10 (because is Gnip's minimum)
      remaining_tweets_quota = 11

      user_mock = Doubles::User.new(
        twitter_datasource_quota: remaining_tweets_quota
      )

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurl\.cartodb/) do |request|
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

      twitter_api = twitter_datasource.send :search_api

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

      output = twitter_datasource.send :search_by_category, twitter_api, filters, category, csv_dumper

      output.should eq remaining_tweets_quota

      csv_dumper.send :destroy_files
    end

    it 'tests basic full search flow' do
      user_quota = 100
      user_mock = Doubles::User.new({twitter_datasource_quota: user_quota})
      data_import_mock = Doubles::DataImport.new({id: '123456789', service_item_id: '987654321'})

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurl\.cartodb/) do |request|
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

      twitter_datasource.send :audit_entry, Doubles::SearchTweet

      twitter_datasource.data_import_item = data_import_mock

      output = twitter_datasource.get_resource(::JSON.dump(
        {
          categories: input_terms[:categories],
          dates:      input_dates[:dates]
        }
      ))

      output.should eq data_from_file('sample_tweets_expected.csv')

      audit_entry = twitter_datasource.send :audit_entry
      # 40 = 2 categories of 20 results each (10 per .json, one with next the other without)
      audit_entry.retrieved_items.should eq 40
      audit_entry.user_id.should eq user_mock.id
      audit_entry.data_import_id.should eq data_import_mock.id
      audit_entry.service_item_id.should eq data_import_mock.service_item_id
      audit_entry.state.should eq 'importing'

      data_import_item = twitter_datasource.send :data_import_item
      data_import_item.id.should eq data_import_mock.id
    end

    it 'tests user limits on datasource usage' do
      twitter_datasource = Search::Twitter.get_new(get_config, Doubles::User.new)

      # Service enabled tests
      result = twitter_datasource.send :is_service_enabled?, Doubles::User.new({
        has_org: true,
        twitter_datasource_enabled: true,
        org_twitter_datasource_enabled: true
      })
      result.should eq true

      result = twitter_datasource.send :is_service_enabled?, Doubles::User.new({
        has_org: true,
        twitter_datasource_enabled: false,
        org_twitter_datasource_enabled: true
      })
      result.should eq false

      result = twitter_datasource.send :is_service_enabled?, Doubles::User.new({
        twitter_datasource_enabled: true,
      })
      result.should eq true

      result = twitter_datasource.send :is_service_enabled?, Doubles::User.new({
      twitter_datasource_enabled: false,
      })
      result.should eq false

      # Quota & soft limit tests
      result = twitter_datasource.send :has_enough_quota?, Doubles::User.new({
        soft_twitter_datasource_limit: false,
        twitter_datasource_quota: 10,
      })
      result.should eq true

      result = twitter_datasource.send :has_enough_quota?, Doubles::User.new({
        soft_twitter_datasource_limit: true,
        twitter_datasource_quota: 0,
      })
      result.should eq true

      result = twitter_datasource.send :has_enough_quota?, Doubles::User.new({
        soft_twitter_datasource_limit: false,
        twitter_datasource_quota: 0,
      })
      result.should eq false
    end

    it 'checks terms sanitize method' do
      twitter_datasource = Search::Twitter.get_new(get_config, Doubles::User.new)

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

  def data_from_file(filename)
    File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
  end

end

