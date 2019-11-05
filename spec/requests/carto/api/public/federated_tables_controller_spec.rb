require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::FederatedTablesController do
  include_context 'users helper'
  include HelperMethods

  before(:each) do
    host! "#{@user1.username}.localhost.lan"
  end

  describe '#list_federated_servers' do
    it 'returns 200 with the federated server list' do
      federated_server_name = "fs_001_from_#{@user1.username}_to_#{@user2.username}"
      params_register = { api_key: @user1.api_key }
      payload_register = {
        federated_server_name: federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register), payload_register do |response|
        expect(response.status).to eq(201)

        params_list = { api_key: @user1.api_key, page: 1, per_page: 10 }
        get_json api_v4_federated_servers_list_servers_url(params_list) do |response|
          expect(response.status).to eq(200)

          expect(response.body[:total]).to eq(1)

          expect(response.body[:result][0][:federated_server_name]).to eq(federated_server_name)
          expect(response.body[:result][0][:dbname]).to eq(@user2.database_name)
          expect(response.body[:result][0][:host]).to eq(@user2.database_host)
        end
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

  describe '#register_federated_server' do
    before(:each) do
      @federated_server_name = "fs_002_from_#{@user1.username}_to_#{@user2.username}"
      @payload = {
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
      params = { api_key: @user1.api_key }

      post_json api_v4_federated_servers_register_server_url(params), @payload do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}")
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

  describe '#show_federated_server' do
    before(:each) do
      @federated_server_name = "fs_003_from_#{@user1.username}_to_#{@user2.username}"
    end

    it 'returns 200 with the federated server' do
      params_register = { api_key: @user1.api_key }
      payload_register = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register), payload_register do |response|
        expect(response.status).to eq(201)

        params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
        get_json api_v4_federated_servers_get_server_url(params) do |response|
          expect(response.status).to eq(200)

          expect(response.body[:federated_server_name]).to eq(@federated_server_name)
          expect(response.body[:dbname]).to eq(@user2.database_name)
          expect(response.body[:host]).to eq(@user2.database_host)
        end
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name }
      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, api_key: api_key.token }

      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 404 when there is not a faderated server with the provided name' do
      params = { federated_server_name: 'wadus', api_key: @user1.api_key }

      get_json api_v4_federated_servers_get_server_url(params) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#update_federated_server' do
    before(:each) do
      @federated_server_name = "fs_004_from_#{@user1.username}_to_#{@user2.username}"
      @payload = {
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
    end

    it 'returns 201 with the federated server was created' do
      params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }

      put_json api_v4_federated_servers_update_server_url(params), @payload do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}")
      end
    end

    it 'returns 204 with the federated server was updated' do
      federated_server_name = "fs_005_from_#{@user1.username}_to_#{@user2.username}"
      @payload[:federated_server_name] = federated_server_name
      params_register = { api_key: @user1.api_key }

      post_json api_v4_federated_servers_register_server_url(params_register), @payload do |response|
        expect(response.status).to eq(201)

        params = { federated_server_name: federated_server_name, api_key: @user1.api_key }
        @payload[:port] = '5433'
        put_json api_v4_federated_servers_update_server_url(params), @payload do |response|
          expect(response.status).to eq(204)
        end
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: 'azure' }
      put_json api_v4_federated_servers_update_server_url(params), @payload do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: 'azure', api_key: api_key.token }

      put_json api_v4_federated_servers_update_server_url(params), @payload do |response|
        expect(response.status).to eq(403)
      end
    end

    xit 'returns 422 when payload is missing' do
      params = { federated_server_name: 'azure', api_key: @user1.api_key }
      payload = {}

      put_json api_v4_federated_servers_update_server_url(params), payload do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#unregister_federated_server' do
    it 'returns 204 with the federated server was destroyed' do
      federated_server_name = "fs_005_from_#{@user1.username}_to_#{@user2.username}"
      params_register = { api_key: @user1.api_key }
      payload_register = {
        federated_server_name: federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register), payload_register do |response|
        expect(response.status).to eq(201)

        params = { federated_server_name: federated_server_name, api_key: @user1.api_key }
        delete_json api_v4_federated_servers_unregister_server_url(params), @payload do |response|
          expect(response.status).to eq(204)
        end
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: 'wadus' }
      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: 'wadus', api_key: api_key.token }

      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 404 when there is not a faderated server with the provided name' do
      params = { federated_server_name: 'wadus', api_key: @user1.api_key }

      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#list_remote_schemas' do
    before(:each) do
      @federated_server_name = "fs_007_from_#{@user1.username}_to_#{@user2.username}"
    end

    it 'returns 200 with the remote schemas list' do
      params_register = { api_key: @user1.api_key }
      payload_register = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register), payload_register do |response|
        expect(response.status).to eq(201)

        params = { federated_server_name: @federated_server_name, api_key: @user1.api_key, page: 1, per_page: 10 }
        get_json api_v4_federated_servers_list_schemas_url(params) do |response|
          expect(response.status).to eq(200)

          expect(response.body[:total] > 0)
          found = response.body[:result].select {|schema| schema[:remote_schema_name] == 'public'}.first
          expect(found[:remote_schema_name]).to eq('public')
          puts response.body[:result]
        end
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_schemas_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, api_key: api_key.token, page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_schemas_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end
  end

  describe '#list_remote_tables' do
    before(:each) do
      @federated_server_name = "fs_008_from_#{@user1.username}_to_#{@user2.username}"
    end

    it 'returns 200 with the remote tables list' do
      params_register = { api_key: @user1.api_key }
      payload_register = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register), payload_register do |response|
        expect(response.status).to eq(201)

        params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: @user1.api_key, page: 1, per_page: 10 }
        get_json api_v4_federated_servers_list_tables_url(params) do |response|
          expect(response.status).to eq(200)

          expect(response.body[:total] > 0)
          found = response.body[:result].select {|schema| schema[:remote_table_name] == 'geometry_columns'}.first
          expect(found[:remote_table_name]).to eq('geometry_columns')
        end
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_tables_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: api_key.token, page: 1, per_page: 10 }

      get_json api_v4_federated_servers_list_tables_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end
  end

  describe '#register_remote_table' do
    before(:each) do
      @federated_server_name = "fs_009_from_#{@user1.username}_to_#{@user2.username}"
    end

    it 'returns 201 with the federated server was created' do
      @user2.in_database.execute('CREATE TABLE my_table(id integer NOT NULL, geom geometry, geom_webmercator geometry)')
      params_register = { api_key: @user1.api_key }
      payload_register = {
        federated_server_name: @federated_server_name,
        mode: 'read-only',
        dbname: @user2.database_name,
        host: @user2.database_host,
        port: '5432',
        username: @user2.database_username,
        password: @user2.database_password
      }
      post_json api_v4_federated_servers_register_server_url(params_register), payload_register do |response|
        expect(response.status).to eq(201)

        params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: @user1.api_key }
        payload = {
          remote_table_name: 'my_table',
          local_table_name_override: 'my_table',
          id_column_name: 'id',
          geom_column_name: 'geom',
          webmercator_column_name: 'geom_webmercator'
        }
        post_json api_v4_federated_servers_register_table_url(params), payload do |response|
          expect(response.status).to eq(201)
          expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}/remote_schemas/public/remote_tables/my_table")
          @user2.in_database.execute('DROP TABLE my_table')
        end
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public' }
      payload = {
        remote_table_name: 'my_table',
        local_table_name_override: 'my_table',
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }

      post_json api_v4_federated_servers_register_table_url(params), payload do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: api_key.token }
      payload = {
        remote_table_name: 'my_table',
        local_table_name_override: 'my_table',
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }

      post_json api_v4_federated_servers_register_table_url(params), payload do |response|
        expect(response.status).to eq(403)
      end
    end

    xit 'returns 422 when payload is missing' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: @user1.api_key }
      payload = {}

      post_json api_v4_federated_servers_register_table_url(params), payload do |response|
        puts response.body
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#show_remote_table' do
    before(:each) do
      @federated_server_name = "fs_010_from_#{@user1.username}_to_#{@user2.username}"
      @user2.in_database.execute('CREATE TABLE my_table(id integer NOT NULL, geom geometry, geom_webmercator geometry)')
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
      puts api_v4_federated_servers_register_server_url(params_register_server)
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)

        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: @user1.api_key }
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
      params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(204)
        @user2.in_database.execute('DROP TABLE my_table')
      end
    end

    it 'returns 200 with the remote table' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(200)

        expect(response.body[:remote_table_name]).to eq('my_table')
        expect(response.body[:qualified_name]).to eq('public.my_table')
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table' }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: api_key.token }

      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 404 when there is not a remote table with the provided name' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'wadus', api_key: @user1.api_key }

      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#update_remote_table' do
    before(:each) do
      @federated_server_name = "fs_011_from_#{@user1.username}_to_#{@user2.username}"
      @user2.in_database.execute('CREATE TABLE my_table(id integer NOT NULL, geom geometry, geom_webmercator geometry)')
      @user2.in_database.execute('CREATE TABLE my_other_table(id integer NOT NULL, geom geometry, geom_webmercator geometry)')
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

        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: @user1.api_key }
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
      params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(204)

        @user2.in_database.execute('DROP TABLE my_table')
        @user2.in_database.execute('DROP TABLE my_other_table')
      end
    end

    it 'returns 201 with the remote table was created' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_other_table', api_key: @user1.api_key }
      payload_update_table = {
        remote_table_name: 'my_other_table',
        local_table_name_override: 'my_other_table',
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }

      put_json api_v4_federated_servers_update_table_url(params_update_table), payload_update_table do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}/remote_schemas/public/remote_tables/my_other_table")
      end
    end

    it 'returns 204 with the remote table was updated' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: @user1.api_key }
      payload_update_table = {
        remote_table_name: 'my_table',
        local_table_name_override: 'my_table',
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }

      put_json api_v4_federated_servers_update_table_url(params), payload_update_table do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', }
      put_json api_v4_federated_servers_update_table_url(params), @payload do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: api_key.token }

      put_json api_v4_federated_servers_update_table_url(params), @payload do |response|
        expect(response.status).to eq(403)
      end
    end

    xit 'returns 422 when payload is missing' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: @user1.api_key }
      payload = {}

      put_json api_v4_federated_servers_update_table_url(params), payload do |response|
        expect(response.status).to eq(422)
      end
    end
  end

  describe '#unregister_remote_table' do
    before(:each) do
      @federated_server_name = "fs_012_from_#{@user1.username}_to_#{@user2.username}"
      @user2.in_database.execute('CREATE TABLE my_table(id integer NOT NULL, geom geometry, geom_webmercator geometry)')
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

        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: 'public', api_key: @user1.api_key }
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
      params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(204)

        @user2.in_database.execute('DROP TABLE my_table')
      end
    end

    it 'returns 204' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: @user1.api_key }

      delete_json api_v4_federated_servers_unregister_table_url(params), @payload do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 401 when non authenticated user' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table' }
      delete_json api_v4_federated_servers_unregister_table_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 403 when using a regular API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'my_table', api_key: api_key.token }

      delete_json api_v4_federated_servers_unregister_table_url(params) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 404 when there is not a remote table with the provided name' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: 'public', remote_table_name: 'wadus', api_key: @user1.api_key }

      delete_json api_v4_federated_servers_unregister_table_url(params) do |response|
        expect(response.status).to eq(404)
      end
    end
  end
end
