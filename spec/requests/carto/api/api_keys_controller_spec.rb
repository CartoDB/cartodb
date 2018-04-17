require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'
require 'base64'

describe Carto::Api::ApiKeysController do
  include CartoDB::Factories
  include HelperMethods

  def response_grants_should_include_request_permissions(reponse_grants, table_permissions)
    table_permissions.each do |stp|
      response_tables = reponse_grants.find { |grant| grant['type'] == 'database' }['tables']
      response_permissions_for_table =
        response_tables.find { |rtp| rtp['schema'] == stp['schema'] && rtp['name'] == stp['name'] }['permissions']
      response_permissions_for_table.sort.should eq stp['permissions'].sort
    end
  end

  def json_headers_for_key(key)
    json_headers_with_auth(key.user.username, key.token)
  end

  def json_headers_with_auth(username, token)
    http_json_headers.merge(
      'Authorization' => 'Basic ' + Base64.strict_encode64("#{username}:#{token}")
    )
  end

  def empty_grants
    [{ type: "apis", apis: [] }]
  end

  def public_api_key
    @carto_user.api_keys.find(&:default_public?)
  end

  def regular_api_key
    @carto_user.reload.api_keys.find(&:regular?)
  end

  def empty_payload
    {
      name: 'wadus',
      grants: empty_grants
    }
  end

  let(:create_payload) do
    {
      name: 'wadus',
      grants: [
        {
          "type" => "apis",
          "apis" => []
        },
        {
          "type" => "database",
          "tables" => [
            {
              "schema" => @carto_user.database_schema,
              "name" => @table1.name,
              "permissions" => []
            }
          ]
        }
      ]
    }
  end

  before(:all) do
    @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
    @user = FactoryGirl.create(:valid_user)
    @carto_user = Carto::User.find(@user.id)
    @other_user = FactoryGirl.create(:valid_user)
    @table1 = create_table(user_id: @carto_user.id)
    @table2 = create_table(user_id: @carto_user.id)
  end

  after(:all) do
    @table2.destroy
    @table1.destroy
    @user.destroy
    @auth_api_feature_flag.destroy
  end

  after(:each) do
    @carto_user.api_keys.where(type: Carto::ApiKey::TYPE_REGULAR).each(&:destroy)
  end

  def generate_api_key_url(req_params, name: nil)
    name ? api_key_url(req_params.merge(id: name)) : api_keys_url(req_params)
  end

  def user_req_params(user, token = nil)
    { user_domain: user.username, api_key: token || user.api_key }
  end

  describe '#authorization' do
    shared_examples 'unauthorized' do
      before(:all) do
        @api_key = FactoryGirl.create(:api_key_apis, user: @unauthorized_user)
      end

      after(:all) do
        @api_key.destroy
      end

      it 'to create api keys' do
        post_json generate_api_key_url(user_req_params(@unauthorized_user)), create_payload do |response|
          expect(response.status).to eq 404
        end
      end

      it 'to destroy api keys' do
        delete_json generate_api_key_url(user_req_params(@unauthorized_user), name: @api_key.name) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'to regenerate api keys' do
        options = { user_domain: @unauthorized_user.username, api_key: @unauthorized_user.api_key, id: @api_key.name }
        post_json regenerate_api_key_token_url(options) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'to show api keys' do
        get_json generate_api_key_url(user_req_params(@unauthorized_user), name: @api_key.name) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'to list api keys' do
        get_json generate_api_key_url(user_req_params(@unauthorized_user)) do |response|
          expect(response.status).to eq 404
        end
      end
    end

    describe 'without feature flag' do
      before(:all) do
        @unauthorized_user = Carto::User.find(FactoryGirl.create(:valid_user).id)
      end

      before(:each) do
        User.any_instance.stubs(:has_feature_flag?).with('auth_api').returns(false)
      end

      after(:all) do
        ::User[@unauthorized_user.id].destroy
      end

      it_behaves_like 'unauthorized'
    end

    describe 'without engine_enabled' do
      before(:all) do
        @unauthorized_user = Carto::User.find(FactoryGirl.create(:valid_user, engine_enabled: false).id)
      end

      after(:all) do
        ::User[@unauthorized_user.id].destroy
      end

      it_behaves_like 'unauthorized'
    end
  end

  shared_examples 'authorized' do
    describe '#create' do
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
                "schema" => @carto_user.database_schema,
                "name" => @table1.name,
                "permissions" => [
                  "insert",
                  "select",
                  "update",
                  "delete"
                ]
              },
              {
                "schema" => @carto_user.database_schema,
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
        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(payload), auth_headers do |response|
          response.status.should eq 201
          api_key_response = response.body
          api_key_response[:id].should_not be
          api_key_response[:name].should eq name
          api_key_response[:user][:username].should eq @carto_user.username
          api_key_response[:type].should eq 'regular'
          api_key_response[:token].should_not be_empty

          request_table_permissions = grants.find { |grant| grant['type'] == 'database' }['tables']
          response_grants_should_include_request_permissions(api_key_response[:grants], request_table_permissions)

          api_key_response[:databaseConfig].should_not be

          Carto::ApiKey.where(name: api_key_response[:name]).each(&:destroy)
        end
      end

      it 'creates allows empty apis grants' do
        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(create_payload), auth_headers do |response|
          response.status.should eq 201
          api_key_response = response.body
          api_key_response[:id].should_not be
          api_key_response[:name].should eq create_payload[:name]
          api_key_response[:user][:username].should eq @carto_user.username
          api_key_response[:type].should eq 'regular'
          api_key_response[:token].should_not be_empty
          api_key_response[:databaseConfig].should_not be

          Carto::ApiKey.where(name: api_key_response[:name]).each(&:destroy)
        end
      end

      it 'fails if grants is not a json array' do
        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus'), auth_headers do |response|
          response.status.should eq 422
          error_response = response.body
          error_response[:errors].should match /grants has to be an array/
        end

        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: 'something'), auth_headers do |response|
          response.status.should eq 422
          error_response = response.body
          error_response[:errors].should match /grants has to be an array/
        end

        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: {}), auth_headers do |response|
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
              'schema' => @carto_user.database_schema,
              'name' => @table1.name,
              'permissions' => ['read']
            ]
          },
          {
            'type' => 'apis',
            'apis' => ['maps', 'sql']
          }
        ]
        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: grants), auth_headers do |response|
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
              'schema' => @carto_user.database_schema,
              'name' => 'wadus',
              'permissions' => ['select']
            ]
          },
          {
            'type' => 'apis',
            'apis' => ['maps', 'sql']
          }
        ]
        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: grants), auth_headers do |response|
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
        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: grants), auth_headers do |response|
          response.status.should eq 422
          error_response = response.body
          error_response[:errors].should match /can only grant permissions over owned tables/
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

        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: grants), auth_headers do |response|
          response.status.should eq 201
          api_key_response = response.body
          api_key_response[:id].should_not  be
          api_key_response[:name].should eq 'wadus'
        end

        auth_user(@carto_user)
        post_json api_keys_url, auth_params.merge(name: 'wadus', grants: grants), auth_headers do |response|
          response.status.should eq 422
          api_key_response = response.body
          api_key_response[:errors].should match /Name has already been taken/
        end

        Carto::ApiKey.where(name: 'wadus').each(&:destroy)
      end
    end

    describe '#destroy' do
      it 'destroys the API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        auth_user(@carto_user)
        delete_json api_key_url(id: api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 200
          response.body[:name].should eq api_key.name
        end

        Carto::ApiKey.where(name: api_key.name, user_id: @user.id).first.should be_nil
      end

      it 'returns 403 if API key is master or default public' do
        master_api_key = @carto_user.api_keys.master.first
        default_api_key = @carto_user.api_keys.default_public.first

        auth_user(@carto_user)
        delete_json api_key_url(id: master_api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 403
        end

        auth_user(@carto_user)
        delete_json api_key_url(id: default_api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 403
        end
      end

      it 'returns 404 if API key is not a uuid or it doesn\'t exist' do
        auth_user(@carto_user)
        delete_json api_key_url(id: 'wadus'), auth_params, auth_headers do |response|
          response.status.should eq 404
        end

        auth_user(@carto_user)
        delete_json api_key_url(id: random_uuid), auth_params, auth_headers do |response|
          response.status.should eq 404
        end
      end

      it 'returns 404 if the API key doesn\'t belong to that user' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        auth_user(@other_user)
        delete_json api_key_url(id: api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 404
        end

        Carto::ApiKey.find_by_id(api_key.id).should_not be_nil
        api_key.destroy
      end
    end

    describe '#regenerate' do
      before(:each) do
        @api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
      end

      it 'regenerates the token' do
        old_token = @api_key.token
        auth_user(@carto_user)
        post_json regenerate_api_key_token_url(id: @api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 200
          response.body[:token].should_not be_nil
          response.body[:token].should_not eq old_token
          @api_key.reload
          response.body[:token].should eq @api_key.token
        end
      end

      it 'regenerates master tokens' do
        master_key = @carto_user.api_keys.master.first
        old_token = master_key.token

        auth_user(@carto_user)
        post_json regenerate_api_key_token_url(id: master_key.name), auth_params, auth_headers do |response|
          response.status.should eq 200
          response.body[:token].should_not be_nil
          response.body[:token].should_not eq old_token
          master_key.reload
          response.body[:token].should eq master_key.token
          @carto_user.reload.api_key.should eq master_key.token
        end
      end
    end

    describe '#show' do
      it 'returns requested API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        auth_user(@carto_user)
        get_json api_key_url(id: api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 200
          response.body[:name].should eq api_key.name
        end
        api_key.destroy
      end

      it 'returns 404 if the API key does not exist' do
        auth_user(@carto_user)
        get_json api_key_url(id: 'wadus'), auth_params, auth_headers do |response|
          response.status.should eq 404
        end
      end

      it 'returns 404 if the API key does not belong to the user' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        auth_user(@other_user)
        get_json api_key_url(id: api_key.name), auth_params, auth_headers do |response|
          response.status.should eq 404
        end
        api_key.destroy
      end
    end

    describe '#index' do
      before(:all) do
        @user_index = FactoryGirl.create(:valid_user)
        @carto_user_index = Carto::User.find(@user_index.id)
        Carto::ApiKey.where(user_id: @user_index.id).each(&:destroy)

        @apikeys = []
        5.times { @apikeys << FactoryGirl.create(:api_key_apis, user_id: @user_index.id) }
      end

      it 'paginates correcty' do
        auth_user(@carto_user_index)
        get_json api_keys_url, auth_params.merge(per_page: 2), auth_headers do |response|
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

        auth_user(@carto_user_index)
        get_json api_keys_url, auth_params.merge(per_page: 2, page: 2), auth_headers do |response|
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

        auth_user(@carto_user_index)
        get_json api_keys_url, auth_params.merge(per_page: 2, page: 3), auth_headers do |response|
          response.status.should eq 200
          response.body[:total].should eq 5
          response.body[:count].should eq 1
          response.body[:_links][:first][:href].should match /page=1/
          expect(response.body[:_links].keys).not_to include(:next)
          response.body[:_links][:last][:href].should match /page=3/
          response.body[:result].size.should eq 1
          response.body[:result][0]['name'].should eq @apikeys[4].name
        end

        auth_user(@carto_user_index)
        get_json api_keys_url, auth_params.merge(per_page: 3), auth_headers do |response|
          response.status.should eq 200
          response.body[:total].should eq 5
          response.body[:count].should eq 3
          response.body[:_links][:first][:href].should match /page=1/
          response.body[:_links][:next][:href].should match /page=2/
          response.body[:_links][:last][:href].should match /page=2/
          response.body[:result].size.should eq 3
          3.times { |n| response.body[:result][n]['name'].should eq @apikeys[n].name }
        end

        auth_user(@carto_user_index)
        get_json api_keys_url, auth_params.merge(per_page: 10), auth_headers do |response|
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

      it 'returns the list of master and default API key for a given user' do
        auth_user(@carto_user)
        get_json api_keys_url, auth_params, auth_headers do |response|
          response.status.should eq 200
          response.body[:total].should eq 2
          response.body[:count].should eq 2
          response.body[:_links][:first][:href].should match /page=1/
          expect(response.body[:_links].keys).not_to include(:prev)
          expect(response.body[:_links].keys).not_to include(:next)
          response.body[:result].size.should eq 2
        end
      end

      it 'validates order param' do
        [:type, :name, :updated_at].each do |param|
          auth_user(@carto_user_index)
          get_json api_keys_url, auth_params.merge(per_page: 2, page: 2, order: param), auth_headers do |response|
            response.status.should eq 200
          end
        end

        auth_user(@carto_user_index)
        get_json api_keys_url, auth_params.merge(per_page: 2, page: 2, order: :invalid), auth_headers do |response|
          response.status.should eq 400
          response.body.fetch(:errors).should_not be_nil
        end
      end
    end
  end

  describe 'with header auth' do
    def auth_user(u)
      @auth_user = u
    end

    def auth_headers
      json_headers_with_auth(@auth_user.username, @auth_user.api_key)
    end

    def auth_params
      { user_domain: @auth_user.username }
    end

    it_behaves_like 'authorized'
  end

  describe 'with api_key auth' do
    def auth_user(u)
      @auth_user = u
    end

    def auth_headers
      http_json_headers
    end

    def auth_params
      { user_domain: @auth_user.username, api_key: @auth_user.api_key }
    end

    it_behaves_like 'authorized'
  end

  describe 'with cookie auth' do
    def auth_user(u)
      @auth_user = u
      host! "#{u.username}.localhost.lan"
      login_as(u, scope: u.username)
    end

    def auth_headers
      http_json_headers
    end

    def auth_params
      {}
    end

    it_behaves_like 'authorized'
  end

  describe 'non-master keys' do
    before(:each) do
      @master_api_key = @carto_user.api_keys.master.first
      @carto_user.api_keys.create_regular_key!(name: 'key1', grants: empty_grants)
    end

    let(:header_params) { { user_domain: @carto_user.username } }

    describe '#create' do
      it 'does not allow default_public api keys' do
        post_json generate_api_key_url(header_params), empty_payload, json_headers_for_key(public_api_key) do |response|
          response.status.should eq 401
        end
      end

      it 'does not allow regular api_keys' do
        post_json generate_api_key_url(header_params), empty_payload, json_headers_for_key(regular_api_key) do |response|
          response.status.should eq 401
        end
      end
    end

    describe '#destroy' do
      it 'does not allow default_public api keys' do
        delete_json generate_api_key_url(header_params, name: regular_api_key.name), nil, json_headers_for_key(public_api_key) do |response|
          response.status.should eq 401
        end
      end

      it 'does not allow regular api_keys' do
        delete_json generate_api_key_url(header_params, name: regular_api_key.name), nil, json_headers_for_key(regular_api_key) do |response|
          response.status.should eq 401
        end
      end
    end

    describe '#regenerate_token' do
      it 'does not allow default_public api keys' do
        post_json regenerate_api_key_token_url(header_params.merge(id: regular_api_key.name)), nil, json_headers_for_key(public_api_key) do |response|
          response.status.should eq 401
        end
      end

      it 'does not allow regular api_keys' do
        post_json regenerate_api_key_token_url(header_params.merge(id: regular_api_key.name)), nil, json_headers_for_key(regular_api_key) do |response|
          response.status.should eq 401
        end
      end
    end

    describe '#index' do
      it 'shows only given api with default_public api keys' do
        get_json generate_api_key_url(header_params), nil, json_headers_for_key(public_api_key) do |response|
          response.status.should eq 200
          response.body[:total].should eq 1
          response.body[:count].should eq 1
          response.body[:result].length.should eq 1
          response.body[:result].first['user']['username'].should eq @carto_user.username
          response.body[:result].first['token'].should eq public_api_key.token
        end
      end

      it 'shows only given api with regular api keys' do
        get_json generate_api_key_url(header_params), nil, json_headers_for_key(regular_api_key) do |response|
          response.status.should eq 200
          response.body[:total].should eq 1
          response.body[:count].should eq 1
          response.body[:result].length.should eq 1
          response.body[:result].first['user']['username'].should eq @carto_user.username
          response.body[:result].first['token'].should eq regular_api_key.token
        end
      end

      it 'with cookie and invalid api key shows everything' do
        host! "#{@carto_user.username}.localhost.lan"
        login_as(@carto_user, scope: @carto_user.username)
        fake_regular_key = regular_api_key.dup
        fake_regular_key.token = 'fake'
        fake_regular_key.user.username = 'fakest'

        get_json api_keys_url, nil, json_headers_for_key(fake_regular_key) do |response|
          response.status.should eq 200
          response.body[:total].should eq 3
          response.body[:count].should eq 3
          response.body[:result].length.should eq 3
        end
      end
    end

    describe '#show' do
      it 'shows given public api_key if authenticated with it' do
        get_json generate_api_key_url(header_params, name: public_api_key.name), nil, json_headers_for_key(public_api_key) do |response|
          response.status.should eq 200
          response.body[:user][:username].should eq @carto_user.username
          response.body[:token].should eq public_api_key.token
        end
      end

      it 'shows given regular api_key if authenticated with it' do
        get_json generate_api_key_url(header_params, name: regular_api_key.name), nil, json_headers_for_key(regular_api_key) do |response|
          response.status.should eq 200
          response.body[:user][:username].should eq @carto_user.username
          response.body[:token].should eq regular_api_key.token
        end
      end

      it 'returns 404 if showing an api key different than the authenticated (public) one' do
        get_json generate_api_key_url(header_params, name: regular_api_key.name), nil, json_headers_for_key(public_api_key) do |response|
          response.status.should eq 404
          response.body[:errors].should eq 'API key not found: key1'
        end
      end

      it 'returns 404 if showing an api key different than the authenticated (regular) one' do
        get_json generate_api_key_url(header_params, name: public_api_key.name), nil, json_headers_for_key(regular_api_key) do |response|
          response.status.should eq 404
          response.body[:errors].should eq 'API key not found: Default public'
        end
      end
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
                "schema" => @carto_user.database_schema,
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
        post_json generate_api_key_url(header_params), payload, json_headers_for_key(@master_api_key) do |response|
          response.status.should eq 201
          Carto::ApiKey.where(name: response.body[:name]).each(&:destroy)
        end
      end

      it 'destroys the API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        delete_json generate_api_key_url(header_params, name: api_key.name), {}, json_headers_for_key(@master_api_key) do |response|
          response.status.should eq 200
          response.body[:name].should eq api_key.name
        end

        Carto::ApiKey.where(name: api_key.name, user_id: @carto_user.id).first.should be_nil
      end

      it 'regenerates the token' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        api_key.save!
        old_token = api_key.token
        options = { user_domain: @user.username, id: api_key.name }
        post_json regenerate_api_key_token_url(options), {}, json_headers_for_key(@master_api_key) do |response|
          response.status.should eq 200
          response.body[:token].should_not be_nil
          response.body[:token].should_not eq old_token
          api_key.reload
          response.body[:token].should eq api_key.token
        end
        api_key.destroy
      end

      it 'returns requested API key' do
        key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        get_json generate_api_key_url(header_params, name: key.name), {}, json_headers_for_key(@master_api_key) do |response|
          response.status.should eq 200
          response.body[:name].should eq key.name
        end
        key.destroy
      end

      it 'returns API key list' do
        get_json generate_api_key_url(header_params), {}, json_headers_for_key(@master_api_key) do |response|
          response.status.should eq 200
        end
      end
    end

    describe 'without header auth fails and does not' do
      it 'create api_key' do
        api_keys_count = @carto_user.api_keys.count
        post_json generate_api_key_url(user_domain: @carto_user.username) do |response|
          response.status.should eq 401
          @carto_user.reload
          @carto_user.api_keys.count.should eq api_keys_count
        end
      end

      it 'destroy the API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        delete_json generate_api_key_url({ user_domain: @carto_user.username }, name: api_key.name) do |response|
          response.status.should eq 401
          Carto::ApiKey.find(api_key.id).should be
        end
        api_key.destroy
      end

      it 'regenerate the token' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        api_key.save!
        old_token = api_key.token
        options = { user_domain: @user.username, id: api_key.id }
        post_json regenerate_api_key_token_url(options), {} do |response|
          response.status.should eq 401
          api_key.reload
          api_key.token.should eq old_token
        end
        api_key.destroy
      end

      it 'return requested API key' do
        api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
        get_json generate_api_key_url(user_domain: @carto_user.username, name: api_key.name) do |response|
          response.status.should eq 401
        end
        api_key.destroy
      end

      it 'return API key list' do
        get_json generate_api_key_url(user_domain: @carto_user.username) do |response|
          response.status.should eq 401
        end
      end
    end
  end

  describe 'query param and special permissions' do
    before :each do
      @carto_user.api_keys.create_regular_key!(name: 'key1', grants: empty_grants)
    end

    describe '#index' do
      it 'shows only given api with default_public api keys' do
        get_json generate_api_key_url(user_req_params(@carto_user, public_api_key.token)), nil do |response|
          response.status.should eq 200
          response.body[:total].should eq 1
          response.body[:count].should eq 1
          response.body[:result].length.should eq 1
          response.body[:result].first['user']['username'].should eq @carto_user.username
          response.body[:result].first['token'].should eq public_api_key.token
        end
      end

      it 'shows only given api with regular api keys' do
        get_json generate_api_key_url(user_req_params(@carto_user, regular_api_key.token)), nil do |response|
          response.status.should eq 200
          response.body[:total].should eq 1
          response.body[:count].should eq 1
          response.body[:result].length.should eq 1
          response.body[:result].first['user']['username'].should eq @carto_user.username
          response.body[:result].first['token'].should eq regular_api_key.token
        end
      end
    end

    describe '#show' do
      it 'shows given public api_key if authenticated with it' do
        get_json generate_api_key_url(user_req_params(@user, public_api_key.token), name: public_api_key.name), nil do |response|
          response.status.should eq 200
          response.body[:user][:username].should eq @carto_user.username
          response.body[:token].should eq public_api_key.token
        end
      end

      it 'shows given regular api_key if authenticated with it' do
        get_json generate_api_key_url(user_req_params(@user, regular_api_key.token), name: regular_api_key.name), nil do |response|
          response.status.should eq 200
          response.body[:user][:username].should eq @carto_user.username
          response.body[:token].should eq regular_api_key.token
        end
      end

      it 'returns 404 if showing an api key different than the authenticated (public) one' do
        get_json generate_api_key_url(user_req_params(@user, public_api_key.token), name: regular_api_key.name), nil do |response|
          response.status.should eq 404
          response.body[:errors].should eq 'API key not found: key1'
        end
      end

      it 'returns 404 if showing an api key different than the authenticated (regular) one' do
        get_json generate_api_key_url(user_req_params(@user, regular_api_key.token), name: public_api_key.name), nil do |response|
          response.status.should eq 404
          response.body[:errors].should eq 'API key not found: Default public'
        end
      end
    end
  end
end
