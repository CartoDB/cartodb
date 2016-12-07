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
      'search_url'    => 'http://fakeurlv1.cartodb',
      'search_url_v2' => 'http://fakeurlv2.cartodb'
    }
  end

  before(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#search' do
    it 'tests basic full search flow with streaming for v1' do
      user_quota = 100
      user_mock = CartoDB::Datasources::Doubles::User.new({twitter_datasource_quota: user_quota})
      user_mock.stubs(:has_feature_flag?).with('gnip_v2').returns(false)
      data_import_mock = CartoDB::Datasources::Doubles::DataImport.new(id: '123456789', service_item_id: '987654321')

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurlv1.cartodb/) do |request|
        accept = (request.options[:headers]||{})['Accept'] || 'application/json'
        format = accept.split(',').first

        request.base_url.should eq 'http://fakeurlv1.cartodb'
        request.options[:params][:publisher].should eq 'twitter'
        body = data_from_file('sample_tweets_v1.json')

        Typhoeus::Response.new(
            code: 200,
            headers: { 'Content-Type' => format },
            body: body
        )
      end

      twitter_datasource.send :audit_entry, CartoDB::Datasources::Doubles::SearchTweet
      twitter_datasource.data_import_item = data_import_mock
      stream_location = '/tmp/sample_tweets_v1.csv'
      File.unlink(stream_location) if File.exists?(stream_location)
      stream = File.open(stream_location, 'wb')
      twitter_datasource.stream_resource(::JSON.dump(
         {
           categories: input_terms[:categories],
           dates:      input_dates[:dates]
         }
       ), stream)

      stored_data = data_from_file(stream_location, true)
      stored_data.should eq data_from_file('sample_tweets_v1.csv')
      File.unlink(stream_location)
    end

    it 'tests basic full search flow with streaming for v2' do
      user_quota = 100
      user_mock = CartoDB::Datasources::Doubles::User.new({twitter_datasource_quota: user_quota})
      user_mock.stubs(:has_feature_flag?).with('gnip_v2').returns(true)
      data_import_mock = CartoDB::Datasources::Doubles::DataImport.new(id: '123456789', service_item_id: '987654321')

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurlv2\.cartodb/) do |request|
        accept = (request.options[:headers]||{})['Accept'] || 'application/json'
        format = accept.split(',').first

        request.base_url.should eq 'http://fakeurlv2.cartodb'
        request.options[:params].key?(:pusblisher).should eq false
        body = data_from_file('sample_tweets_v2.json')

        Typhoeus::Response.new(
            code: 200,
            headers: { 'Content-Type' => format },
            body: body
        )
      end

      twitter_datasource.send :audit_entry, CartoDB::Datasources::Doubles::SearchTweet
      twitter_datasource.data_import_item = data_import_mock
      stream_location = '/tmp/sample_tweets_v2.csv'
      File.unlink(stream_location) if File.exists?(stream_location)
      stream = File.open(stream_location, 'wb')
      twitter_datasource.stream_resource(::JSON.dump(
         {
           categories: input_terms[:categories],
           dates:      input_dates[:dates]
         }
       ), stream)

      stored_data = data_from_file(stream_location, true)
      stored_data.should eq data_from_file('sample_tweets_v2.csv')
      File.unlink(stream_location)
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
