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

  describe '#search' do
    # TODO: Move this to integration specs
    it 'tests basic full search flow with streaming' do
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

      stream_location = '/tmp/twitter_spec_stream.csv'

      File.unlink(stream_location) if File.exists?(stream_location)
      stream = File.open(stream_location, 'wb')

      twitter_datasource.stream_resource(::JSON.dump(
         {
           categories: input_terms[:categories],
           dates:      input_dates[:dates]
         }
       ), stream)

      stored_data = data_from_file(stream_location, true)

      stored_data.should eq data_from_file('twitter_spec_stream.csv')
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

