# encoding: utf-8
require_relative '../../twitter-search'
require_relative '../../../../spec/rspec_configuration'

include CartoDB::TwitterSearch

describe SearchAPI do
  describe '#config_and_params' do
    it 'checks correct params sent to config and as query payload' do
      params = {
        SearchAPI::PARAM_QUERY      => 'carto has:geo has:profile_geo',
        SearchAPI::PARAM_MAXRESULTS => 10
      }

      Typhoeus.stub(/.*sample_tweets.json/).and_return(
        Typhoeus::Response.new(code: 200, body: data_from_file('sample_tweets.json'))
      )

      api = SearchAPI.new({SearchAPI::CONFIG_AUTH_REQUIRED => false,
                           SearchAPI::CONFIG_AUTH_USERNAME => 'testuser',
                           SearchAPI::CONFIG_AUTH_PASSWORD => 'testpass',
                           SearchAPI::CONFIG_SEARCH_URL => 'http://fakeurl.../sample_tweets.json'
                          })

      api.params = params

      api.query_param = 'carto has:geo has:profile_geo'

      data = api.fetch_results

      data[:next].nil?.should eq true
      data[:results].nil?.should eq false

      # manually read data from fixture to compare some fields:
      fixture = ::JSON.parse(data_from_file('sample_tweets.json'), symbolize_names: true)

      data[:next].should eq fixture[:next]
      data[:results].should eq fixture[:results]
    end

  end

  def data_from_file(filename)
    File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
  end
end

