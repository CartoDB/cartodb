# encoding: utf-8
require_relative '../../twitter-search'

#require_relative '../../../../spec/spec_helper'

include CartoDB::TwitterSearch

describe SearchAPI do
  describe ''#config_and_params'' do
    it 'checks correct params sent to config and as query payload' do
      params = {
          SearchAPI::PARAM_MAXRESULTS => 500,
          SearchAPI::PARAM_FROMDATE   => '201407070600',
          SearchAPI::PARAM_TODATE     => '201407132359'
      }

      #Typhoeus::Request.any_instance.stubs(:run).returns(nil)

      api = SearchAPI.new({
        SearchAPI::CONFIG_AUTH_REQUIRED => false,
        #SearchAPI::CONFIG_AUTH_USERNAME => 'testuser',
        #SearchAPI::CONFIG_AUTH_PASSWORD => 'testpass',
        SearchAPI::CONFIG_SEARCH_URL => 'http://kartones.net/'
      })

      api.params = params

      data = api.fetch_results
      puts data.code
      puts data.effective_url

    end

end

