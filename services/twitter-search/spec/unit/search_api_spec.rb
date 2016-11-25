# encoding: utf-8
require_relative '../../twitter-search'
require_relative '../../../../spec/rspec_configuration'

include CartoDB::TwitterSearch

describe SearchAPI do
  describe '#config_and_params' do
    it 'checks correct params sent to config and as query payload for v1' do
      params = {
        SearchAPI::PARAM_QUERY      => 'cartodb has:geo',
        SearchAPI::PARAM_MAXRESULTS => 10,
        #SearchAPI::PARAM_FROMDATE   => '201408070600',
        #SearchAPI::PARAM_TODATE     => '201408132359'
      }

      Typhoeus.stub(/.*sample_tweets_v1.json/).and_return(
        Typhoeus::Response.new(code: 200, body: data_from_file('sample_tweets_v1.json'))
      )

      user_mock = mock
      user_mock.stubs(:has_feature_flag?).with('gnip_v2').returns(false)
      api = SearchAPI.new({SearchAPI::CONFIG_AUTH_REQUIRED => false,
                           SearchAPI::CONFIG_AUTH_USERNAME => 'testuser',
                           SearchAPI::CONFIG_AUTH_PASSWORD => 'testpass',
                           SearchAPI::CONFIG_SEARCH_URL => 'http://fakeurlv1.../sample_tweets_v1.json'
                          }, user_mock)

      api.params = params

      api.query_param = 'cartodb has:geo'

      data = api.fetch_results

      data[:next].nil?.should eq true
      data[:results].nil?.should eq false

      # manually read data from fixture to compare some fields:
      fixture = ::JSON.parse(data_from_file('sample_tweets_v1.json'), symbolize_names: true)

      data[:next].should eq fixture[:next]
      data[:results].should eq fixture[:results]
    end

    it 'checks correct params sent to config and as query payload for v2' do
      params = {
        # SearchAPI::PARAM_QUERY      => 'cartodb has:geo',
        SearchAPI::PARAM_MAXRESULTS => 10,
        #SearchAPI::PARAM_FROMDATE   => '201408070600',
        #SearchAPI::PARAM_TODATE     => '201408132359'
      }

      Typhoeus.stub(/.*sample_tweets_v2.json/).and_return(
        Typhoeus::Response.new(code: 200, body: data_from_file('sample_tweets_v2.json'))
      )

      user_mock = mock
      user_mock.stubs(:has_feature_flag?).with('gnip_v2').returns(true)
      api = SearchAPI.new({
        SearchAPI::CONFIG_AUTH_REQUIRED => false,
        SearchAPI::CONFIG_AUTH_USERNAME => 'testuser',
        SearchAPI::CONFIG_AUTH_PASSWORD => 'testpass',
        SearchAPI::CONFIG_SEARCH_URL => 'http://fakeurlv2.../sample_tweets_v2.json'
      }, user_mock)

      api.params = params

      api.query_param = 'cartodb has:geo'

      data = api.fetch_results

      data[:next].nil?.should eq true
      data[:results].nil?.should eq false

      # manually read data from fixture to compare some fields:
      fixture = ::JSON.parse(data_from_file('sample_tweets_v2.json'), symbolize_names: true)

      data[:next].should eq fixture[:next]
      data[:results].should eq fixture[:results]
    end
  end

  def data_from_file(filename)
    File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
  end
end

