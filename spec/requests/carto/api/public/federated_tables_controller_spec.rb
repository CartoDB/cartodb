require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::FederatedTablesController do
  include_context 'users helper'
  include HelperMethods

  before(:each) do
    host! "#{@user1.username}.localhost.lan"
  end

  describe '#list_federated_servers' do
    before(:each) do
      @federated_server_name = "fs_001_from_#{@user1.username}_to_#{@user2.username}"
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 200 with the federated server list' do
      params_list_servers = { api_key: @user1.api_key, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(1)
        expect(response.body[:result][0][:federated_server_name]).to eq(@federated_server_name)
        expect(response.body[:result][0][:dbname]).to eq(@user2.database_name)
        expect(response.body[:result][0][:host]).to eq(@user2.database_host)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_list_servers = { page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_list_servers = { api_key: api_key.token, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end
  end

  describe '#register_federated_server' do
    before(:each) do
      @federated_server_name = "fs_002_from_#{@user1.username}_to_#{@user2.username}"
      @payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
    end

    it 'returns 201 with the federated server was created' do
      params_register_server = { api_key: @user1.api_key }
      post_json api_v4_federated_servers_register_server_url(params_register_server), @payload_register_server do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}")
      end
    end

    it 'returns 401 when non authenticated user' do
      post_json api_v4_federated_servers_register_server_url, @payload_register_server do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_register_server = { api_key: api_key.token }
      post_json api_v4_federated_servers_register_server_url(params_register_server), @payload_register_server do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 422 when payload is missing' do
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {}
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#show_federated_server' do
    before(:each) do
      @federated_server_name = "fs_003_from_#{@user1.username}_to_#{@user2.username}"
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 200 with the federated server' do
      params_show_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_server_url(params_show_server) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:federated_server_name]).to eq(@federated_server_name)
        expect(response.body[:dbname]).to eq(@user2.database_name)
        expect(response.body[:host]).to eq(@user2.database_host)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_show_server = { federated_server_name: @federated_server_name }
      get_json api_v4_federated_servers_get_server_url(params_show_server) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_show_server = { federated_server_name: @federated_server_name, api_key: api_key.token }
      get_json api_v4_federated_servers_get_server_url(params_show_server) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 404 when there is not a faderated server with the provided name' do
      params_show_server = { federated_server_name: 'wadus', api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_server_url(params_show_server) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#update_federated_server' do
    before(:each) do
      @federated_server_name = "fs_004_from_#{@user1.username}_to_#{@user2.username}"
      @payload_update_server = {
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      params_register_server = { api_key: @user1.api_key }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 201 with the federated server was created' do
      federated_server_name = "fs_005_from_#{@user1.username}_to_#{@user2.username}"
      payload_update_server = {
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      params_update_server = { federated_server_name: federated_server_name, api_key: @user1.api_key }
      put_json api_v4_federated_servers_update_server_url(params_update_server), payload_update_server do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{federated_server_name}")
      end
    end

    it 'returns 204 with the federated server was updated' do
      params_update_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      put_json api_v4_federated_servers_update_server_url(params_update_server), @payload_update_server do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_update_server = { federated_server_name: @federated_server_name }
      put_json api_v4_federated_servers_update_server_url(params_update_server), @payload_update_server do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_update_server = { federated_server_name: @federated_server_name, api_key: api_key.token }
      put_json api_v4_federated_servers_update_server_url(params_update_server), @payload_update_server do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 422 when payload is missing' do
      params_update_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      payload_update_server = {}
      put_json api_v4_federated_servers_update_server_url(params_update_server), payload_update_server do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#unregister_federated_server' do
    before(:each) do
      @federated_server_name = "fs_006_from_#{@user1.username}_to_#{@user2.username}"
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    it 'returns 204 with the federated server was destroyed' do
      params_unregister_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_unregister_server = { federated_server_name: @federated_server_name }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_unregister_server = { federated_server_name: @federated_server_name, api_key: api_key.token }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 404 when there is not a faderated server with the provided name' do
      params_unregister_server = { federated_server_name: 'wadus', api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#list_remote_schemas' do
    before(:each) do
      @federated_server_name = "fs_007_from_#{@user1.username}_to_#{@user2.username}"
      params_register_server= { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 200 with the remote schemas list' do
      params_list_schemas = { federated_server_name: @federated_server_name, api_key: @user1.api_key, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_schemas_url(params_list_schemas) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total] > 0)
        found = response.body[:result].select {|schema| schema[:remote_schema_name] == 'public'}.first
        expect(found[:remote_schema_name]).to eq('public')
      end
    end

    it 'returns 401 when non authenticated user' do
      params_list_schemas = { federated_server_name: @federated_server_name, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_schemas_url(params_list_schemas) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_list_schemas = { federated_server_name: @federated_server_name, api_key: api_key.token, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_schemas_url(params_list_schemas) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end
  end

  describe '#list_remote_tables' do
    before(:each) do
      @federated_server_name = "fs_008_from_#{@user1.username}_to_#{@user2.username}"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table'
      @user2.in_database.execute("CREATE TABLE #{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
        @user2.in_database.execute("DROP TABLE #{@remote_table_name}")
      end
    end

    it 'returns 200 with the remote tables list' do
      params_list_tables = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_tables_url(params_list_tables) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total] > 0)
        found = response.body[:result].select {|schema| schema[:remote_table_name] == @remote_table_name}.first
        expect(found[:remote_table_name]).to eq(@remote_table_name)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_list_tables = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_tables_url(params_list_tables) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_list_tables = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: api_key.token, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_tables_url(params_list_tables) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end
  end

  describe '#register_remote_table' do
    before(:each) do
      @federated_server_name = "fs_009_from_#{@user1.username}_to_#{@user2.username}"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table'
      @payload_register_table = {
        remote_table_name: @remote_table_name,
        local_table_name_override: @remote_table_name,
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }
      @user2.in_database.execute("CREATE TABLE #{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
        @user2.in_database.execute("DROP TABLE #{@remote_table_name}")
      end
    end

    it 'returns 201 with the federated server was created' do
      params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
      post_json api_v4_federated_servers_register_table_url(params_register_table), @payload_register_table do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}/remote_schemas/#{@remote_schema_name}/remote_tables/#{@remote_table_name}")
      end
    end

    it 'returns 401 when non authenticated user' do
      params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name }
      post_json api_v4_federated_servers_register_table_url(params_register_table), @payload_register_table do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: api_key.token }
      post_json api_v4_federated_servers_register_table_url(params_register_table), @payload_register_table do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 422 when payload is missing' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
      payload = {}

      post_json api_v4_federated_servers_register_table_url(params), payload do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#show_remote_table' do
    before(:each) do
      @federated_server_name = "fs_010_from_#{@user1.username}_to_#{@user2.username}"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table'
      @user2.in_database.execute("CREATE TABLE #{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
        payload_register_table = {
          remote_table_name: @remote_table_name,
          local_table_name_override: @remote_table_name,
          id_column_name: 'id',
          geom_column_name: 'geom',
          webmercator_column_name: 'geom_webmercator'
        }
        post_json api_v4_federated_servers_register_table_url(params_register_table), payload_register_table do |response|
          expect(response.status).to eq(201)
        end
      end
    end

    after(:each) do
      params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(204)
        @user2.in_database.execute("DROP TABLE #{@remote_table_name}")
      end
    end

    it 'returns 200 with the remote table' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:remote_table_name]).to eq(@remote_table_name)
        expect(response.body[:qualified_name]).to eq("#{@remote_schema_name}.#{@remote_table_name}")
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: api_key.token }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 404 when there is not a remote table with the provided name' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: 'wadus', api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#update_remote_table' do
    before(:each) do
      @federated_server_name = "fs_011_from_#{@user1.username}_to_#{@user2.username}"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table'
      @remote_table_name_2 = 'my_other_table'
      @payload_update_table = {
        remote_table_name: @remote_table_name,
        local_table_name_override: @remote_table_name,
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }
      @user2.in_database.execute("CREATE TABLE #{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      @user2.in_database.execute("CREATE TABLE #{@remote_table_name_2}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
        payload_register_table = {
          remote_table_name: 'my_table',
          local_table_name_override: 'my_table',
          id_column_name: 'id',
          geom_column_name: 'geom',
          webmercator_column_name: 'geom_webmercator'
        }
        post_json api_v4_federated_servers_register_table_url(params_register_table), payload_register_table do |response|
          expect(response.status).to eq(201)
        end
      end
    end

    after(:each) do
      params_unregister_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(204)
        @user2.in_database.execute("DROP TABLE #{@remote_table_name}")
        @user2.in_database.execute("DROP TABLE #{@remote_table_name_2}")
      end
    end

    it 'returns 201 with the remote table was created' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name_2, api_key: @user1.api_key }
      payload_update_table = {
        remote_table_name: @remote_table_name_2,
        local_table_name_override: @remote_table_name_2,
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }
      put_json api_v4_federated_servers_update_table_url(params_update_table), payload_update_table do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}/remote_schemas/#{@remote_schema_name}/remote_tables/#{@remote_table_name_2}")
      end
    end

    it 'returns 204 with the remote table was updated' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      put_json api_v4_federated_servers_update_table_url(params_update_table), @payload_update_table do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name }
      put_json api_v4_federated_servers_update_table_url(params_update_table), @payload_update_table do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: api_key.token }
      put_json api_v4_federated_servers_update_table_url(params_update_table), @payload_update_table do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 422 when payload is missing' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      payload_update_table = {}
      put_json api_v4_federated_servers_update_table_url(params_update_table), payload_update_table do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#unregister_remote_table' do
    before(:each) do
      @federated_server_name = "fs_012_from_#{@user1.username}_to_#{@user2.username}"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table'
      @user2.in_database.execute("CREATE TABLE #{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
        payload_register_table = {
          remote_table_name: @remote_table_name ,
          local_table_name_override: @remote_table_name ,
          id_column_name: 'id',
          geom_column_name: 'geom',
          webmercator_column_name: 'geom_webmercator'
        }
        post_json api_v4_federated_servers_register_table_url(params_register_table), payload_register_table do |response|
          expect(response.status).to eq(201)
        end
      end
    end

    after(:each) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
        @user2.in_database.execute("DROP TABLE #{@remote_table_name}")
      end
    end

    it 'returns 204' do
      params_unregister_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_table_url(params_unregister_table), @payload do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 401 when non authenticated user' do
      params_unregister_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name }
      delete_json api_v4_federated_servers_unregister_table_url(params_unregister_table) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params_unregister_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: api_key.token }
      delete_json api_v4_federated_servers_unregister_table_url(params_unregister_table) do |response|
        expect(response.status).to eq(403)
        api_key.destroy
      end
    end

    it 'returns 404 when there is not a remote table with the provided name' do
      params_unregister_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: 'wadus', api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_table_url(params_unregister_table) do |response|
        expect(response.status).to eq(404)
      end
    end
  end
end
