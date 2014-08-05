# encoding: utf-8
require_relative '../../twitter-search'

#require_relative '../../../../spec/spec_helper'

include CartoDB::TwitterSearch

describe SearchAPI do
  describe ''#config_and_params'' do
    it 'checks correct params sent to config and as query payload' do
      params = {
          # Each term  should have the "has geo"
          SearchAPI::PARAM_QUERY      => 'cartodb has:geo',
          SearchAPI::PARAM_MAXRESULTS => 10,
          #SearchAPI::PARAM_FROMDATE   => '201408070600',
          #SearchAPI::PARAM_TODATE     => '201408132359'
      }

      # TODO: Fake url and load from disk to not depend on exteral services
      api = SearchAPI.new({
        SearchAPI::CONFIG_AUTH_REQUIRED => false,
        SearchAPI::CONFIG_AUTH_USERNAME => 'testuser',
        SearchAPI::CONFIG_AUTH_PASSWORD => 'testpass',
        SearchAPI::CONFIG_SEARCH_URL => 'http://kartones.net/tmp/cartodb/sample_tweets.json'
      })

      api.params = params

      data = api.fetch_results

      puts data
    end

end

