require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'
require 'base64'

describe Carto::Api::ApiKeysController do
  include_context 'users helper'
  include HelperMethods

  def response_grants_should_include_request_permissions(reponse_grants, table_permissions)
    table_permissions.each do |stp|
      response_tables = reponse_grants.find { |grant| grant['type'] == 'database'}['tables']
      response_permissions_for_table =
        response_tables.find { |rtp| rtp['schema'] == stp['schema'] && rtp['name'] == stp['name'] }['permissions']
      response_permissions_for_table.sort.should eq stp['permissions'].sort
    end
  end

  before(:all) do
    @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
  end

  after(:all) do
    @auth_api_feature_flag.destroy
  end

  def generate_api_key_url(req_params, name: nil)
    name ? api_key_url(req_params.merge(id: name)) : api_keys_url(req_params)
  end

  def user_req_params(user)
    { user_domain: user.username, api_key: user.api_key }
  end

  describe '#create' do
    before(:each) do
      @table1 = create_table(user_id: @carto_user1.id)
      @table2 = create_table(user_id: @carto_user1.id)
    end

    after(:each) do
      @table2.destroy
      @table1.destroy
    end

    it 'creates a new API key' do
      grants = [
        {
          "type" => "apis",
          "apis" => ["sql", "maps"]
        },
        {
          "type" => "database",
          "tables" => [
            {
              "schema" => @carto_user1.database_schema,
              "name" => @table1.name,
              "permissions" => [
                "insert",
                "select",
                "update",
                "delete"
              ]
            },
            {
              "schema" => @carto_user1.database_schema,
              "name" => @table2.name,
              "permissions" => [
                "select"
              ]
            }
          ]
        }
      ]
      name = 'wadus'
      payload = {
        name: name,
        grants: grants
      }
      post_json generate_api_key_url(user_req_params(@carto_user1)), payload do |response|
        response.status.should eq 201
        api_key_response = response.body
        api_key_response[:id].should_not be
        api_key_response[:name].should eq name
        api_key_response[:user][:username].should eq @carto_user1.username
        api_key_response[:type].should eq 'regular'
        api_key_response[:token].should_not be_empty

        request_table_permissions = grants.find { |grant| grant['type'] == 'database' }['tables']
        response_grants_should_include_request_permissions(api_key_response[:grants], request_table_permissions)

        api_key_response[:databaseConfig].should_not be

        Carto::ApiKey.where(name: api_key_response[:name]).each(&:destroy)
      end
    end

    it 'creates allows empty apis grants' do
      grants = [
        {
          "type" => "apis",
          "apis" => []
        },
        {
          "type" => "database",
          "tables" => [
            {
              "schema" => @carto_user1.database_schema,
              "name" => @table1.name,
              "permissions" => []
            }
          ]
        }
      ]
      name = 'wadus'
      payload = {
        name: name,
        grants: grants
      }
      post_json generate_api_key_url(user_req_params(@carto_user1)), payload do |response|
        response.status.should eq 201
        api_key_response = response.body
        api_key_response[:id].should_not be
        api_key_response[:name].should eq name
        api_key_response[:user][:username].should eq @carto_user1.username
        api_key_response[:type].should eq 'regular'
        api_key_response[:token].should_not be_empty
        api_key_response[:databaseConfig].should_not be

        Carto::ApiKey.where(name: api_key_response[:name]).each(&:destroy)
      end
    end

    it 'fails if grants is not a json array' do
      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus' do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /grants has to be an array/
      end
      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: "something" do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /grants has to be an array/
      end
      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: {} do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /grants has to be an array/
      end
    end

    it 'fails if permissions contains not valid entries' do
      grants = [
        {
          'type' => 'database',
          'tables' => [
            'schema' => @carto_user1.database_schema,
            'name' => @table1.name,
            'permissions' => ['read']
          ]
        },
        {
          'type' => 'apis',
          'apis' => ['maps', 'sql']
        }
      ]
      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: grants do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /permissions.*did not match one of the following values: insert, select, update, delete/
      end
    end

    it 'fails if database does not exist' do
      grants = [
        {
          'type' => 'database',
          'tables' => [
            'schema' => @carto_user1.database_schema,
            'name' => 'wadus',
            'permissions' => ['select']
          ]
        },
        {
          'type' => 'apis',
          'apis' => ['maps', 'sql']
        }
      ]
      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: grants do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /relation \"public.wadus\" does not exist/
      end
    end

    it 'fails if schema does not exist' do
      grants = [
        {
          'type' => 'database',
          'tables' => [
            'schema' => 'wadus',
            'name' => @table1.name,
            'permissions' => ['select']
          ]
        },
        {
          'type' => 'apis',
          'apis' => ['maps', 'sql']
        }
      ]
      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: grants do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /schema \"wadus\" does not exist/
      end
    end

    it 'fails if there\'s already an apikey with given name' do
      grants = [
        {
          'type' => 'database',
          'tables' => [
            'schema' => @table1.database_schema,
            'name' => @table1.name,
            'permissions' => ['select']
          ]
        },
        {
          'type' => 'apis',
          'apis' => ['maps', 'sql']
        }
      ]

      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: grants do |response|
        response.status.should eq 201
        api_key_response = response.body
        api_key_response[:id].should_not  be
        api_key_response[:name].should eq 'wadus'
      end

      post_json generate_api_key_url(user_req_params(@carto_user1)), name: 'wadus', grants: grants do |response|
        response.status.should eq 422
        api_key_response = response.body
        api_key_response[:errors].should match /Duplicate API Key name: wadus/
      end

      Carto::ApiKey.where(name: 'wadus').each(&:destroy)
    end
  end

  describe '#destroy' do
    it 'destroys the API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      delete_json generate_api_key_url(user_req_params(@user1), name: api_key.name) do |response|
        response.status.should eq 200
        response.body[:name].should eq api_key.name
      end

      Carto::ApiKey.where(name: api_key.name, user_id: @user1.id).first.should be_nil
    end

    it 'returns 404 if API key is not a uuid or it doesn\'t exist' do
      delete_json generate_api_key_url(user_req_params(@user1), name: 'wadus') do |response|
        response.status.should eq 404
      end

      delete_json generate_api_key_url(user_req_params(@user1), name: random_uuid) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 if the API key doesn\'t belong to that user' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      delete_json generate_api_key_url(user_req_params(@user2), name: api_key.name) do |response|
        response.status.should eq 404
      end

      Carto::ApiKey.find_by_id(api_key.id).should_not be_nil
      api_key.destroy
    end
  end

  describe '#regenerate' do
    before(:all) do
      @api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
    end

    after(:all) do
      @api_key.destroy
    end

    it 'regenerates the token' do
      old_token = @api_key.token
      options = { user_domain: @user1.username, api_key: @user1.api_key, id: @api_key.name }
      post_json regenerate_api_key_token_url(options) do |response|
        response.status.should eq 200
        response.body[:token].should_not be_nil
        response.body[:token].should_not eq old_token
        @api_key.reload
        response.body[:token].should eq @api_key.token
      end
    end
  end

  describe '#show' do
    it 'returns requested API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      get_json generate_api_key_url(user_req_params(@user1), name: api_key.name) do |response|
        response.status.should eq 200
        response.body[:name].should eq api_key.name
      end
      api_key.destroy
    end

    it 'returns 404 if the API key does not exist' do
      get_json generate_api_key_url(user_req_params(@user1), name: 'wadus') do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 if the API key does not belong to the user' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      get_json generate_api_key_url(user_req_params(@user2), name: api_key.name) do |response|
        response.status.should eq 404
      end
      api_key.destroy
    end

    it 'returns 401 if api_key is not provided' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      get_json generate_api_key_url(user_req_params(Carto::User.new), name: api_key.name) do |response|
        response.status.should eq 401
      end
      api_key.destroy
    end
  end

  describe '#index' do
    before :all do
      Carto::User.find(@user1.id).api_keys.each(&:destroy)
    end

    before :all do
      @apikeys = []
      5.times { @apikeys << FactoryGirl.create(:api_key_apis, user_id: @user1.id) }
    end

    after :all do
      @apikeys.each(&:destroy)
    end

    it 'paginates correcty' do
      get_json generate_api_key_url(user_req_params(@user1).merge(per_page: 2)) do |response|
        response.status.should eq 200
        response.body[:total].should eq 5
        response.body[:count].should eq 2
        expect(response.body[:_links].keys).not_to include(:prev)
        response.body[:_links][:first][:href].should match /page=1/
        response.body[:_links][:next][:href].should match /page=2/
        response.body[:_links][:last][:href].should match /page=3/
        response.body[:result].size.should eq 2
        response.body[:result][0]['name'].should eq @apikeys[0].name
        response.body[:result][1]['name'].should eq @apikeys[1].name
      end

      get_json generate_api_key_url(user_req_params(@user1).merge(per_page: 2, page: 2)) do |response|
        response.status.should eq 200
        response.body[:total].should eq 5
        response.body[:count].should eq 2
        response.body[:_links][:first][:href].should match /page=1/
        response.body[:_links][:prev][:href].should match /page=1/
        response.body[:_links][:next][:href].should match /page=3/
        response.body[:_links][:last][:href].should match /page=3/
        response.body[:result].size.should eq 2
        response.body[:result][0]['name'].should eq @apikeys[2].name
        response.body[:result][1]['name'].should eq @apikeys[3].name
      end

      get_json generate_api_key_url(user_req_params(@user1).merge(per_page: 2, page: 3)) do |response|
        response.status.should eq 200
        response.body[:total].should eq 5
        response.body[:count].should eq 1
        response.body[:_links][:first][:href].should match /page=1/
        expect(response.body[:_links].keys).not_to include(:next)
        response.body[:_links][:last][:href].should match /page=3/
        response.body[:result].size.should eq 1
        response.body[:result][0]['name'].should eq @apikeys[4].name
      end

      get_json generate_api_key_url(user_req_params(@user1).merge(per_page: 3)) do |response|
        response.status.should eq 200
        response.body[:total].should eq 5
        response.body[:count].should eq 3
        response.body[:_links][:first][:href].should match /page=1/
        response.body[:_links][:next][:href].should match /page=2/
        response.body[:_links][:last][:href].should match /page=2/
        response.body[:result].size.should eq 3
        3.times { |n| response.body[:result][n]['name'].should eq @apikeys[n].name }
      end

      get_json generate_api_key_url(user_req_params(@user1).merge(per_page: 10)) do |response|
        response.status.should eq 200
        response.body[:total].should eq 5
        response.body[:count].should eq 5
        response.body[:_links][:first][:href].should match /page=1/
        expect(response.body[:_links].keys).not_to include(:prev)
        expect(response.body[:_links].keys).not_to include(:next)
        response.body[:result].size.should eq 5
        5.times { |n| response.body[:result][n]['name'].should eq @apikeys[n].name }
      end
    end

    it 'returns empty list if the API key does not belong to the user' do
      get_json generate_api_key_url(user_req_params(@user2)) do |response|
        response.status.should eq 200
        response.body[:total].should eq 0
        response.body[:count].should eq 0
        response.body[:_links][:first][:href].should match /page=1/
        expect(response.body[:_links].keys).not_to include(:prev)
        expect(response.body[:_links].keys).not_to include(:next)
        response.body[:result].size.should eq 0
      end
    end

    it 'returns 401 if api_key is not provided' do
      @user1.api_key = nil
      get_json generate_api_key_url(@user1) do |response|
        response.status.should eq 401
      end
    end
  end

  describe 'header auth' do
    before :all do
      @master_api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id, type: 'master')
    end

    after :all do
      @master_api_key.destroy
    end

    before :each do
      @table1 = create_table(user_id: @carto_user1.id)
    end

    after :each do
      @table1.destroy
    end

    def json_headers_with_auth
      http_json_headers.merge(
        'Authorization' => 'Basic ' + Base64.encode64("#{@user1.username}:#{@master_api_key.token}")
      )
    end

    describe 'with header auth' do
      it 'creates api_key' do
        grants = [
          {
            "type" => "apis",
            "apis" => []
          },
          {
            "type" => "database",
            "tables" => [
              {
                "schema" => @carto_user1.database_schema,
                "name" => @table1.name,
                "permissions" => []
              }
            ]
          }
        ]
        name = 'wadus'
        payload = {
          name: name,
          grants: grants
        }
        post_json generate_api_key_url(user_req_params(@carto_user1)), payload, json_headers_with_auth do |response|
          response.status.should eq 201
          Carto::ApiKey.where(name: response.body[:name]).each(&:destroy)
        end
      end

      it 'destroys the API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
        params = user_req_params(@user1)
        delete_json generate_api_key_url(params, name: api_key.name), {}, json_headers_with_auth do |response|
          response.status.should eq 200
          response.body[:name].should eq api_key.name
        end

        Carto::ApiKey.where(name: api_key.name, user_id: @carto_user1.id).first.should be_nil
      end

      it 'regenerates the token' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
        api_key.save!
        old_token = api_key.token
        options = { user_domain: @user1.username, id: api_key.name }
        post_json regenerate_api_key_token_url(options), {}, json_headers_with_auth do |response|
          response.status.should eq 200
          response.body[:token].should_not be_nil
          response.body[:token].should_not eq old_token
          api_key.reload
          response.body[:token].should eq api_key.token
        end
        api_key.destroy
      end

      it 'returns requested API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
        get_json generate_api_key_url(user_req_params(@user1), name: api_key.name), {}, json_headers_with_auth do |response|
          response.status.should eq 200
          response.body[:name].should eq api_key.name
        end
        api_key.destroy
      end

      it 'returns API key list' do
        get_json generate_api_key_url(user_req_params(@user1)), {}, json_headers_with_auth do |response|
          response.status.should eq 200
        end
      end
    end

    describe 'without header auth fails and does not' do
      it 'create api_key' do
        api_keys_count = @carto_user1.api_keys.count
        post_json generate_api_key_url(user_req_params(@carto_user1).merge(api_key: nil)) do |response|
          response.status.should eq 401
          @carto_user1.reload
          @carto_user1.api_keys.count.should eq api_keys_count
        end
      end

      it 'destroy the API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
        delete_json generate_api_key_url(user_req_params(@user1).merge(api_key: nil), name: api_key.name) do |response|
          response.status.should eq 401
          Carto::ApiKey.find(api_key.id).should be
        end
        api_key.destroy
      end

      it 'regenerate the token' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
        api_key.save!
        old_token = api_key.token
        options = { user_domain: @user1.username, id: api_key.id }
        post_json regenerate_api_key_token_url(options), {} do |response|
          response.status.should eq 401
          api_key.reload
          api_key.token.should eq old_token
        end
        api_key.destroy
      end

      it 'return requested API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
        get_json generate_api_key_url(user_req_params(@user1).merge(api_key: nil), name: api_key.name) do |response|
          response.status.should eq 401
        end
        api_key.destroy
      end

      it 'return API key list' do
        get_json generate_api_key_url(user_req_params(@user1).merge(api_key: nil)) do |response|
          response.status.should eq 401
        end
      end
    end
  end
end
