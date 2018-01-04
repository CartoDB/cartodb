require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'

describe Carto::Api::ApiKeysController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
  end

  after(:all) do
    @auth_api_feature_flag.destroy
  end

  def generate_api_key_url(user, id: nil)
    options = { user_domain: user.username, api_key: user.api_key }
    id ? api_key_url(options.merge(id: id)) : api_keys_url(options)
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
      post_json generate_api_key_url(@carto_user1), payload do |response|
        response.status.should eq 201
        api_key_response = response.body
        api_key_response[:id].should_not be_empty
        api_key_response[:name].should eq name
        api_key_response[:user][:username].should eq @carto_user1.username
        api_key_response[:type].should eq 'regular'
        api_key_response[:token].should_not be_empty
        api_key_response[:grants].should eq grants
        api_key_response[:databaseConfig].should_not be_empty
        api_key_response[:databaseConfig].should_not be_empty
        api_key_response[:databaseConfig][:role].should_not be_empty
        api_key_response[:databaseConfig][:password].should_not be_empty

        Carto::ApiKey.find(api_key_response[:id]).destroy
      end
    end

    it 'fails if grants is not a json array' do
      post_json generate_api_key_url(@carto_user1), name: 'wadus' do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /grants has to be an array/
      end
      post_json generate_api_key_url(@carto_user1), name: 'wadus', grants: "something" do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /grants has to be an array/
      end
      post_json generate_api_key_url(@carto_user1), name: 'wadus', grants: {} do |response|
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
      post_json generate_api_key_url(@carto_user1), name: 'wadus', grants: grants do |response|
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
      post_json generate_api_key_url(@carto_user1), name: 'wadus', grants: grants do |response|
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
      post_json generate_api_key_url(@carto_user1), name: 'wadus', grants: grants do |response|
        response.status.should eq 422
        error_response = response.body
        error_response[:errors].should match /schema \"wadus\" does not exist/
      end
    end
  end

  describe '#destroy' do
    it 'destroys the API key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      delete_json generate_api_key_url(@user1, id: api_key.id) do |response|
        response.status.should eq 200
        response.body[:id].should eq api_key.id
      end

      Carto::ApiKey.find_by_id(api_key.id).should be_nil
    end

    it 'returns 404 if API key is not a uuid or it doesn\'t exist' do
      delete_json generate_api_key_url(@user1, id: 'wadus') do |response|
        response.status.should eq 404
      end

      delete_json generate_api_key_url(@user1, id: random_uuid) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 if the API key doesn\'t belong to that user' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user1.id)
      delete_json generate_api_key_url(@user2, id: api_key.id) do |response|
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
      options = { user_domain: @user1.username, api_key: @user1.api_key, id: @api_key.id }
      post_json regenerate_api_key_token_url(options) do |response|
        response.status.should eq 200
        response.body[:token].should_not be_nil
        response.body[:token].should_not eq old_token
        @api_key.reload
        response.body[:token].should eq @api_key.token
      end
    end
  end
end
