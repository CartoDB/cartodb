require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::FederatedTablesController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    host! "#{@user1.username}.localhost.lan"

    puts "Starting remote server"
    @dir = Cartodb.get_config(:federated_server, 'dir')
    port = Cartodb.get_config(:federated_server, 'port')
    user = Cartodb.get_config(:federated_server, 'test_user')
    pg_bindir = Cartodb.get_config(:federated_server, 'pg_bindir_path')
    unless pg_bindir.present?
      pg_bindir = `pg_config --bindir`.delete!("\n")
    end
    @pg_ctl     = "#{pg_bindir}/pg_ctl"
    @psql       = "#{pg_bindir}/psql"

    raise "Federated server directory is not configured!" unless @dir.present?
    raise "Federated server port is not configured!" unless port.present?
    raise "Federated server user is not configured!" unless user.present?
    raise "Binary 'pg_ctl' could not be found" unless system("which #{@pg_ctl}")
    raise "Binary 'psql' could not be found" unless system("which #{@psql}")

    puts "Starting the remote server"
    raise("Could not start the federated DB") unless system("#{@pg_ctl} start --silent -D #{@dir} >/dev/null")

    @remote_host     = "127.0.0.1"
    @remote_port     = "#{port}"
    @remote_database = "#{user}"
    @remote_username = "#{user}"
    @remote_password = "#{user}"
  end

  after(:all) do
      puts "Stopping the remote server"
      system("#{@pg_ctl} stop --silent -D #{@dir} >/dev/null") || raise("Could not stop the federated DB")
  end

  def remote_query(query)
    status = system("PGPASSWORD='#{@remote_password}' psql -U #{@remote_username} -d #{@remote_database} -h #{@remote_host} -p #{@remote_port} -c \"#{query};\"")
    raise "Failed to execute remote query: #{query}" unless status
  end
  
  def get_payload(name = nil)
    if name.nil? then
      {
        mode: 'read-only',
        dbname: @remote_database,
        host: @remote_host,
        port: @remote_port,
        username: @remote_username,
        password: @remote_username
      }
    else
      {
        federated_server_name: name,
        mode: 'read-only',
        dbname: @remote_database,
        host: @remote_host,
        port: @remote_port,
        username: @remote_username,
        password: @remote_username
      }
    end
  end

  describe '#list_federated_servers' do
    before(:all) do
      @federated_server_name = "fs_001_from_#{@user1.username}_to_remote"
      @params_register_server = { api_key: @user1.api_key }
      @params_unregister_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
    end

    it 'returns 200 with an empty federated server list' do
      params_list_servers = { api_key: @user1.api_key, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(0)
      end
    end

    it 'returns 200 with the federated server list' do
      post_json api_v4_federated_servers_register_server_url(@params_register_server), get_payload(@federated_server_name) do |response|
        expect(response.status).to eq(201)
      end

      params_list_servers = { api_key: @user1.api_key, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(1)
        expect(response.body[:result][0][:federated_server_name]).to eq(@federated_server_name)
        expect(response.body[:result][0][:dbname]).to eq(@remote_database)
        expect(response.body[:result][0][:host]).to eq(@remote_host)
      end

      delete_json api_v4_federated_servers_unregister_server_url(@params_unregister_server) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 200 and works with pager' do
      server_count = 5;
      for i in 1..server_count do
        post_json api_v4_federated_servers_register_server_url(@params_register_server), get_payload("#{@federated_server_name}#{i}") do |response|
          expect(response.status).to eq(201)
        end
      end

      params_list_servers = { api_key: @user1.api_key, page: 1, per_page: 2 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(server_count)
        expect(response.body[:count]).to eq(2)
      end

      params_list_servers = { api_key: @user1.api_key, page: 2, per_page: 2 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(server_count)
        expect(response.body[:count]).to eq(2)
      end

      params_list_servers = { api_key: @user1.api_key, page: 3, per_page: 2 }
      get_json api_v4_federated_servers_list_servers_url(params_list_servers) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq(server_count)
        expect(response.body[:count]).to eq(1)
      end

      for i in 1..server_count do
        delete_json api_v4_federated_servers_unregister_server_url({ federated_server_name: "#{@federated_server_name}#{i}", api_key: @user1.api_key }) do |response|
          expect(response.status).to eq(204)
        end
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
    before(:all) do
      @federated_server_name = "fs_002_from_#{@user1.username}_to_remote"
      @payload_register_server = get_payload(@federated_server_name)
    end

    it 'returns 201 with the federated server was created' do
      params_register_server = { api_key: @user1.api_key }
      post_json api_v4_federated_servers_register_server_url(params_register_server), @payload_register_server do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}")
        expect(response.body[:federated_server_name]).to eq(@federated_server_name)
        expect(response.body[:dbname]).to eq(@payload_register_server[:dbname])
        expect(response.body[:host]).to eq(@payload_register_server[:host])
        expect(response.body[:port]).to eq(@payload_register_server[:port])
      end
    end

    it 'returns 422 when payload is missing' do
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = {}
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(422)
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
  end

  describe '#show_federated_server' do
    before(:all) do
      @federated_server_name = "fs_003_from_#{@user1.username}_to_remote"
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:all) do
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
        expect(response.body[:dbname]).to eq(@remote_database)
        expect(response.body[:host]).to eq(@remote_host)
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

    it 'returns 404 when there is not a federated server with the provided name' do
      params_show_server = { federated_server_name: 'wadus', api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_server_url(params_show_server) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#update_federated_server' do
    before(:all) do
      @federated_server_name = "fs_004_from_#{@user1.username}_to_remote"
      @payload_update_server = get_payload()
      payload_register_server = get_payload(@federated_server_name)
      params_register_server = { api_key: @user1.api_key }
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:all) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 201 with the federated server was created' do
      federated_server_name = "fs_005_from_#{@user1.username}_to_remote"
      payload_update_server = get_payload()
      params_update_server = { federated_server_name: federated_server_name, api_key: @user1.api_key }
      put_json api_v4_federated_servers_update_server_url(params_update_server), payload_update_server do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{federated_server_name}")
        expect(response.body[:federated_server_name]).to eq(federated_server_name)
        expect(response.body[:dbname]).to eq(payload_update_server[:dbname])
        expect(response.body[:host]).to eq(payload_update_server[:host])
        expect(response.body[:port]).to eq(payload_update_server[:port])
      end
    end

    it 'returns 204 with the federated server was updated' do
      params_update_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      put_json api_v4_federated_servers_update_server_url(params_update_server), @payload_update_server do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 422 when payload is missing' do
      params_update_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      payload_update_server = {}
      put_json api_v4_federated_servers_update_server_url(params_update_server), payload_update_server do |response|
        expect(response.status).to eq(422)
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
  end

  describe '#unregister_federated_server' do
    before(:all) do
      @federated_server_name = "fs_006_from_#{@user1.username}_to_remote"
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
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

    it 'returns 404 when there is not a federated server with the provided name' do
      params_unregister_server = { federated_server_name: 'wadus', api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(404)
      end
    end
  end

  describe '#list_remote_schemas' do
    before(:all) do
      @federated_server_name = "fs_007_from_#{@user1.username}_to_remote"
      params_register_server= { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:all) do
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

    it 'returns 200 and an updated list' do
      remote_query("CREATE SCHEMA IF NOT EXISTS new_schema")
      params_list_schemas = { federated_server_name: @federated_server_name, api_key: @user1.api_key, page: 1, per_page: 10 }
      get_json api_v4_federated_servers_list_schemas_url(params_list_schemas) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total] > 0)
        found = response.body[:result].select {|schema| schema[:remote_schema_name] == 'public'}.first
        expect(found[:remote_schema_name]).to eq('public')
        found = response.body[:result].select {|schema| schema[:remote_schema_name] == 'new_schema'}.first
        expect(found[:remote_schema_name]).to eq('new_schema')
      end
      remote_query("DROP SCHEMA new_schema")
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
    before(:all) do
      @federated_server_name = "fs_008_from_#{@user1.username}_to_remote"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table_list_remote'
      remote_query("CREATE TABLE IF NOT EXISTS #{@remote_schema_name}.#{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:all) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
        remote_query("DROP TABLE #{@remote_schema_name}.#{@remote_table_name}")
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
    before(:all) do
      @federated_server_name = "fs_009_from_#{@user1.username}_to_remote"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table_register_remote'
      @payload_register_table = {
        remote_table_name: @remote_table_name,
        local_table_name_override: @remote_table_name,
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }
      remote_query("CREATE TABLE IF NOT EXISTS #{@remote_schema_name}.#{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
      end
    end

    after(:all) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
        remote_query("DROP TABLE #{@remote_schema_name}.#{@remote_table_name}")
      end
    end

    it 'returns 201 with the federated table created' do
      params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
      post_json api_v4_federated_servers_register_table_url(params_register_table), @payload_register_table do |response|
        expect(response.status).to eq(201)
        expect(response.headers['Content-Location']).to eq("/api/v4/federated_servers/#{@federated_server_name}/remote_schemas/#{@remote_schema_name}/remote_tables/#{@remote_table_name}")
        expect(response.body[:remote_table_name]).to eq(@payload_register_table[:remote_table_name])
        expect(response.body[:registered]).to eq(true)
        expect(response.body[:qualified_name]).to eq("cdb_fs_#{@federated_server_name}.#{@remote_table_name}")
      end
    end

    it 'returns 422 when payload is missing' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
      payload = {}
      post_json api_v4_federated_servers_register_table_url(params), payload do |response|
        expect(response.status).to eq(422)
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
  end

  describe '#show_remote_table' do
    before(:all) do
      @federated_server_name = "fs_010_from_#{@user1.username}_to_remote"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table_show_remote'
      remote_query("CREATE TABLE IF NOT EXISTS #{@remote_schema_name}.#{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
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

    after(:all) do
      params = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params) do |response|
        expect(response.status).to eq(204)
        remote_query("DROP TABLE #{@remote_schema_name}.#{@remote_table_name}")
      end
    end

    it 'returns 200 with the remote table' do
      params = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      get_json api_v4_federated_servers_get_table_url(params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:remote_table_name]).to eq(@remote_table_name)
        expect(response.body[:qualified_name]).to eq("cdb_fs_#{@federated_server_name}.#{@remote_table_name}")
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
    before(:all) do
      @federated_server_name = "fs_011_from_#{@user1.username}_to_remote"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table_update_remote_1'
      @remote_table_name_2 = 'my_table_update_remote_2'
      @payload_update_table = {
        remote_table_name: @remote_table_name,
        local_table_name_override: @remote_table_name,
        id_column_name: 'id',
        geom_column_name: 'geom',
        webmercator_column_name: 'geom_webmercator'
      }
      remote_query("CREATE TABLE IF NOT EXISTS #{@remote_schema_name}.#{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      remote_query("CREATE TABLE IF NOT EXISTS #{@remote_schema_name}.#{@remote_table_name_2}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
      post_json api_v4_federated_servers_register_server_url(params_register_server), payload_register_server do |response|
        expect(response.status).to eq(201)
        params_register_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, api_key: @user1.api_key }
        payload_register_table = {
          remote_table_name: @remote_table_name,
          local_table_name_override: 'my_local_table',
          id_column_name: 'id',
          geom_column_name: 'geom',
          webmercator_column_name: 'geom_webmercator'
        }
        post_json api_v4_federated_servers_register_table_url(params_register_table), payload_register_table do |response|
          expect(response.status).to eq(201)
        end
      end
    end

    after(:all) do
      params_unregister_server = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_server) do |response|
        expect(response.status).to eq(204)
        remote_query("DROP TABLE #{@remote_schema_name}.#{@remote_table_name}")
        remote_query("DROP TABLE #{@remote_schema_name}.#{@remote_table_name_2}")
      end
    end

    it 'returns 201 with the remote table created' do
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
        expect(response.body[:remote_table_name]).to eq(payload_update_table[:remote_table_name])
        expect(response.body[:registered]).to eq(true)
        expect(response.body[:qualified_name]).to eq("cdb_fs_#{@federated_server_name}.#{@remote_table_name_2}")
      end
    end

    it 'returns 204 with the remote table updated' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      put_json api_v4_federated_servers_update_table_url(params_update_table), @payload_update_table do |response|
        expect(response.status).to eq(204)
      end
    end

    it 'returns 422 when payload is missing' do
      params_update_table = { federated_server_name: @federated_server_name, remote_schema_name: @remote_schema_name, remote_table_name: @remote_table_name, api_key: @user1.api_key }
      payload_update_table = {}
      put_json api_v4_federated_servers_update_table_url(params_update_table), payload_update_table do |response|
        expect(response.status).to eq(422)
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
  end

  describe '#unregister_remote_table' do
    before(:all) do
      @federated_server_name = "fs_012_from_#{@user1.username}_to_remote"
      @remote_schema_name = 'public'
      @remote_table_name = 'my_table_unregister_remote'
      remote_query("CREATE TABLE #{@remote_schema_name}.#{@remote_table_name}(id integer NOT NULL, geom geometry, geom_webmercator geometry)")
      params_register_server = { api_key: @user1.api_key }
      payload_register_server = get_payload(@federated_server_name)
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

    after(:all) do
      params_unregister_table = { federated_server_name: @federated_server_name, api_key: @user1.api_key }
      delete_json api_v4_federated_servers_unregister_server_url(params_unregister_table) do |response|
        expect(response.status).to eq(204)
        remote_query("DROP TABLE #{@remote_schema_name}.#{@remote_table_name}")
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
