# encoding: utf-8

require_relative '../../lib/datasources'
require_relative '../doubles/user'

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

    it 'tests date filters' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_dates = dates_fixture

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'from'
      output.should eq '20140303134900'

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'to'
      output.should eq '20140304115900'

      expect {
        twitter_datasource.send :build_date_from_fields, input_dates, 'wadus'
      }.to raise_error ParameterError

    end

    it 'tests twitter search integration (without conversion to CSV' do
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

      output = twitter_datasource.send :do_search, twitter_api, filters, user_mock

      output.count.should eq 40
    end

    it 'tests basic full search flow' do
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

      output = twitter_datasource.get_resource(::JSON.dump(
        {
          categories: input_terms[:categories],
          dates:      input_dates[:dates]
        }
      ))

      # 2 pages of 10 results per category search, two categories
      output.count.should eq 40

    end

  end

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

