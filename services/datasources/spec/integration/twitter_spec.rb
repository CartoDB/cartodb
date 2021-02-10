require 'spec_helper_min'
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
      'search_url'    => 'http://fakeurl.carto',
    }
  end

  before(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#search' do
    it 'tests basic full search flow with streaming' do
      user_quota = 100
      user_mock = CartoDB::Datasources::Doubles::User.new({twitter_datasource_quota: user_quota})
      data_import_mock = CartoDB::Datasources::Doubles::DataImport.new(id: '123456789', service_item_id: '987654321')
      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      Typhoeus.stub(/fakeurl\.carto/) do |request|
        accept = (request.options[:headers]||{})['Accept'] || 'application/json'
        format = accept.split(',').first

        request.base_url.should eq 'http://fakeurl.carto'
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
      stream.close

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
          category: '1',
          terms:    ['carto']
        }
      ]
    }
  end

  def dates_fixture
    {
      dates: {
        fromDate: '2017-02-21',
        fromHour: '11',
        fromMin:  '45',
        toDate:   '2017-02-21',
        toHour:   '12',
        toMin:    '00'
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
