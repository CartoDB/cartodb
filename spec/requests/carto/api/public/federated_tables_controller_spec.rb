require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::FederatedTablesController do
  include_context 'users helper'
  include HelperMethods

  describe '#list' do
    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 200 with the federated server list' do
      @params = { api_key: @user1.api_key, page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_servers_url(@params) do |response|
        expect(response.status).to eq(200)

        expect(response.body[:total]).to eq(2)

        expect(response.body[:result][0][:name]).to eq('amazon')
        expect(response.body[:result][0][:dbname]).to eq('testdb')
        expect(response.body[:result][0][:host]).to eq('myhostname.us-east-2.rds.amazonaws.com')

        expect(response.body[:result][1][:name]).to eq('azure')
        expect(response.body[:result][1][:dbname]).to eq('db')
        expect(response.body[:result][1][:host]).to eq('us-east-2.azure.com')
      end
    end

    it 'returns 401 when non authenticated user' do
      @params = { page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_servers_url(@params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      @params = { api_key: @user1.api_key, page: 1, per_page: 10 }
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)

      get_json api_v4_federated_servers_list_servers_url(@params.merge(api_key: api_key.token)) do |response|
        expect(response.status).to eq(403)
      end
    end
  end
end
