require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::FederatedTablesController do
  include_context 'users helper'
  include HelperMethods

  before(:each) do
    host! "#{@user1.username}.localhost.lan"
  end

  describe '#index' do
    it 'returns 200 with the federated server list' do
      params = { api_key: @user1.api_key, page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_servers_url(params) do |response|
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
      params = { page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_servers_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { api_key: api_key.token, page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_servers_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end
  end

  describe '#register_server' do
    before(:each) do
      @payload = {
        name: 'amazon',
        mode: 'read-only',
        dbname: 'testdb',
        host: 'myhostname.us-east-2.rds.amazonaws.com',
        port: '5432',
        username: 'read_only_user',
        password: 'secret'
      }
    end

    it 'returns 201 with the federated server created' do
      params = { api_key: @user1.api_key }

      post_json api_v4_federated_servers_register_server_url(params), @payload do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq('/api/v4/federated_servers/amazon')
      end
    end

    it 'returns 401 when non authenticated user' do
      post_json api_v4_federated_servers_register_server_url, @payload do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { api_key: api_key.token }

      post_json api_v4_federated_servers_register_server_url(params), @payload do |response|
        expect(response.status).to eq(403)
      end
    end

    xit 'returns 422 when payload is missing' do
      params = { api_key: @user1.api_key }
      payload = {}

      post_json api_v4_federated_servers_register_server_url(params), payload do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#show' do
    it 'returns 200 with the federated server' do
      params = { name: 'amazon', api_key: @user1.api_key }

      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(200)

        expect(response.body[:name]).to eq('amazon')
        expect(response.body[:dbname]).to eq('testdb')
        expect(response.body[:host]).to eq('myhostname.us-east-2.rds.amazonaws.com')
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { name: 'amazon' }
      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { name: 'amazon', api_key: api_key.token }

      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end

    xit 'returns 404 when there is not a faderated server with the provided name' do
      params = { name: 'wadus', api_key: @user1.api_key }

      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(404)
      end
    end
  end
end
