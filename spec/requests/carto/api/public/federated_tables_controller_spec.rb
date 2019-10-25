require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::FederatedTablesController do
  include_context 'users helper'
  include HelperMethods

  describe '#list' do
    before(:each) do
      @params = { api_key: @user1.api_key, page: 1, per_page: 10 }
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 200 with the federated server list' do
      get_json api_v4_federated_servers_list_servers_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(2)
        expect(response.body[:result][0][:name]).to eq('amazon')
        expect(response.body[:result][0][:dbname]).to eq('testdb')
        expect(response.body[:result][0][:host]).to eq('myhostname.us-east-2.rds.amazonaws.com')
      end
    end
  end
end
