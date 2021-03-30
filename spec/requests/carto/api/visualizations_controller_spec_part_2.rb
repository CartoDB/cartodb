require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

# TODO: Remove once Carto::Visualization is complete enough
require_relative '../../../../app/models/visualization/member'
require_relative './vizjson_shared_examples'
require_relative './helpers/visualization_controller_helper'
require 'helpers/unique_names_helper'
require_dependency 'carto/uuidhelper'
require 'factories/carto_visualizations'
require 'helpers/visualization_destruction_helper'
require 'helpers/feature_flag_helper'

include Carto::UUIDHelper

describe Carto::Api::VisualizationsController do
  include UniqueNamesHelper
  include Carto::Factories::Visualizations
  include VisualizationDestructionHelper
  include FeatureFlagHelper
  include VisualizationControllerHelper

  before(:all) do
    create_account_type_fg('ORGANIZATION USER')
  end

  describe 'main behaviour' do
    before(:all) do
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)

      Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)

      @user_1 = create(:valid_user)
      @carto_user1 = Carto::User.find(@user_1.id)
      @user_2 = create(:valid_user, private_maps_enabled: true)
      @carto_user2 = Carto::User.find(@user_2.id)
      @api_key = @user_1.api_key
    end

    before(:each) do
      begin
        delete_user_data @user_1
      rescue StandardError => exception
        # Silence named maps problems only here upon data cleaning, not in specs
        raise unless exception.class.to_s == 'CartoDB::NamedMapsWrapper::HTTPResponseError'
      end

      @headers = {
        'CONTENT_TYPE' => 'application/json'
      }
      host! "#{@user_1.username}.localhost.lan"
    end

    after(:all) do
      @user_1.destroy
      @user_2.destroy
    end

    it 'tests exclude_shared and only_shared filters' do
      Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)

      user_1 = create_user(
        username: unique_name('user'),
        email: unique_email,
        password: 'clientex',
        private_tables_enabled: false
      )

      user_2 = create_user(
        username: unique_name('user'),
        email: unique_email,
        password: 'clientex',
        private_tables_enabled: false
      )

      organization = test_organization
      organization.save

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: user_1.id)
      u1_t_1_id = table.table_visualization.id
      u1_t_1_perm_id = table.table_visualization.permission.id

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: user_2.id)
      u2_t_1_id = table.table_visualization.id

      post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
           factory(user_1).to_json, @headers
      last_response.status.should == 200
      u1_vis_1_id = JSON.parse(last_response.body).fetch('id')
      u1_vis_1_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory(user_2).to_json, @headers
      last_response.status.should == 200
      u2_vis_1_id = JSON.parse(last_response.body).fetch('id')

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u2_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u2_vis_1_id

      # Share u1 vis with u2
      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_vis_1_perm_id),
          {acl: [{
            type: Carto::Permission::TYPE_USER,
            entity: {
              id:   user_2.id,
            },
            access: Carto::Permission::ACCESS_READONLY
          }]}.to_json, @headers
      last_response.status.should == 200

      # Vis listing checks
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      # Permissions don't change updated_at
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          exclude_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          only_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          exclude_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          only_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      # Same with 'shared' filter (convenience alias for not handling both exclude_shared and only_shared)
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_NO), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_ONLY), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      # Share u1 table with u2
      request_payload = {
        acl: [
          {
            type: Carto::Permission::TYPE_USER,
            entity: { id: user_2.id },
            access: Carto::Permission::ACCESS_READONLY
          }
        ]
      }.to_json
      put(
        api_v1_permissions_update_url(user_domain: user_1.username, api_key: user_1.api_key, id: u1_t_1_perm_id),
        request_payload,
        @headers
      )
      last_response.status.should == 200

      # Dunno why (rack test error?) but this call seems to cache previous params, so just call it to "flush" them
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          shared: 'wadus',
          exclude_shared: false,
          only_shared: false),
          @headers
      # -------------

      # Table listing checks
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          exclude_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          only_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          exclude_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          only_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_t_1_id
    end


    describe 'tests visualization endpoints in organizations' do
      include_context 'organization with users helper'
      describe 'GET list_watching' do
        it 'returns the users currently on the watching list' do
          vis = create(:carto_visualization, user: @carto_org_user_1)
          user_domain = @carto_org_user_1.username

          get api_v1_visualizations_notify_watching_url(user_domain: user_domain, id: vis.id, api_key: @carto_org_user_1.api_key)
          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body)).to eq([])

          put api_v1_visualizations_notify_watching_url(user_domain: user_domain, id: vis.id, api_key: @carto_org_user_1.api_key)
          expect(last_response.status).to eq(200)

          get api_v1_visualizations_notify_watching_url(user_domain: user_domain, id: vis.id, api_key: @carto_org_user_1.api_key)
          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body)).to eq([@carto_org_user_1.username])
        end

        it 'returns 403 if user does not have read permissions on the visualization' do
          private_vis = create(:carto_visualization, user: @carto_org_user_1, privacy: Carto::Visualization::PRIVACY_PRIVATE)

          get api_v1_visualizations_notify_watching_url(user_domain: @carto_org_user_2.username, id: private_vis.id, api_key: @carto_org_user_2.api_key)
          expect(last_response.status).to eq(403)
        end
      end

      it 'tests totals calculations' do
        bypass_named_maps

        # user 1 will have 1 table and 1 vis
        # user 2 will have 2 of each
        # user 2 will share 1 table and 1 vis with the org
        # user 2 will share the other table and other vis with user 1

        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_1.id)
        u1_t_1_id = table.table_visualization.id

        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_2.id)
        u2_t_1_id = table.table_visualization.id
        u2_t_1_perm_id = table.table_visualization.permission.id

        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_2.id)
        u2_t_2 = table
        u2_t_2_id = table.table_visualization.id
        u2_t_2_perm_id = table.table_visualization.permission.id

        post api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
             factory(@org_user_1).to_json, @headers
        last_response.status.should == 200
        u1_vis_1_id = JSON.parse(last_response.body).fetch('id')

        post api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
             factory(@org_user_2).to_json, @headers
        last_response.status.should == 200
        u2_vis_1_id = JSON.parse(last_response.body).fetch('id')
        u2_vis_1_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

        post api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
             factory(@org_user_2).to_json, @headers
        last_response.status.should == 200
        u2_vis_2_id = JSON.parse(last_response.body).fetch('id')
        u2_vis_2_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 1
        body['total_shared'].should eq 0
        body['total_locked'].should eq 0
        vis = body['visualizations'].first
        vis['id'].should eq u1_t_1_id

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 1
        body['total_shared'].should eq 0
        body['total_locked'].should eq 0
        vis = body['visualizations'].first
        vis['id'].should eq u1_vis_1_id

        # Share u2 vis1 with organization
        request_payload = {
          acl: [
            {
              type: Carto::Permission::TYPE_ORGANIZATION,
              entity: { id: @organization.id },
              access: Carto::Permission::ACCESS_READONLY
            }
          ]
        }.to_json
        request_url_params = { user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: u2_vis_1_perm_id }
        put api_v1_permissions_update_url(request_url_params), request_payload, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 2
        body['total_shared'].should eq 1
        body['total_locked'].should eq 0

        # Share u2 vis2 with u1
        request_payload = {
          acl: [
            {
              type: Carto::Permission::TYPE_USER,
              entity: { id: @org_user_1.id },
              access: Carto::Permission::ACCESS_READONLY
            }
          ]
        }.to_json
        request_url_params = { user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: u2_vis_2_perm_id }
        put api_v1_permissions_update_url(request_url_params), request_payload, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_shared'].should eq 2
        body['total_locked'].should eq 0

        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_vis_1_id, api_key: @org_user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_shared'].should eq 2
        body['total_locked'].should eq 0

        # Multiple likes to same vis shouldn't increment total as is per vis
        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_vis_1_id, api_key: @org_user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_shared'].should eq 2
        body['total_locked'].should eq 0

        # Share u2 table1 with org
        payload = {
          acl: [
            {
              type: Carto::Permission::TYPE_ORGANIZATION,
              entity: { id: @organization.id },
              access: Carto::Permission::ACCESS_READONLY
            }
          ]
        }.to_json
        url_params = { user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: u2_t_1_perm_id }
        put api_v1_permissions_update_url(url_params), payload, @headers

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 2
        body['total_shared'].should eq 1
        body['total_locked'].should eq 0

        # Share u2 table2 with org
        request_payload = {
          acl: [
            {
              type: Carto::Permission::TYPE_USER,
              entity: { id: @org_user_1.id },
              access: Carto::Permission::ACCESS_READONLY
            }
          ]
        }.to_json
        request_url_params = { user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: u2_t_2_perm_id }
        put api_v1_permissions_update_url(request_url_params), request_payload, @headers

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_shared'].should eq 2
        body['total_locked'].should eq 0
        body['visualizations'][0]['table']['name'].should == "\"#{@org_user_2.database_schema}\".#{u2_t_2.name}"

        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_t_1_id, api_key: @org_user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_shared'].should eq 2
        body['total_locked'].should eq 0

        # Multiple likes to same table shouldn't increment total as is per vis
        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_t_1_id, api_key: @org_user_2.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_shared'].should eq 2
        body['total_locked'].should eq 0
      end

    end

    describe 'index endpoint' do

      it 'tests normal users authenticated and unauthenticated calls' do
        bypass_named_maps

        collection = CartoDB::Visualization::Collection.new.fetch(user_id: @user_2.id)
        collection.map(&:delete)

        post api_v1_visualizations_create_url(user_domain: @user_2.username, api_key: @user_2.api_key),
             factory(@user_2).to_json, @headers
        last_response.status.should == 200
        pub_vis_id = JSON.parse(last_response.body).fetch('id')

        put api_v1_visualizations_update_url(user_domain: @user_2.username, api_key: @user_2.api_key, id: pub_vis_id),
            { id: pub_vis_id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers
        last_response.status.should == 200

        post api_v1_visualizations_create_url(user_domain: @user_2.username, api_key: @user_2.api_key),
             factory(@user_2).to_json, @headers
        last_response.status.should == 200
        priv_vis_id = JSON.parse(last_response.body).fetch('id')

        put api_v1_visualizations_update_url(user_domain: @user_2.username, api_key: @user_2.api_key, id: priv_vis_id),
            { id: priv_vis_id, privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE }.to_json,
            @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: @user_2.username, type: 'derived'), @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 1
        vis = body['visualizations'].first
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase

        get api_v1_visualizations_index_url(user_domain: @user_2.username, type: 'derived', api_key: @user_2.api_key,
                                            order: 'updated_at'),
          {}, @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 2
        vis = body['visualizations'][0]
        vis['id'].should eq priv_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE.upcase
        vis = body['visualizations'][1]
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase
      end

      it 'tests organization users authenticated and unauthenticated calls' do
        bypass_named_maps

        organization = test_organization
        organization.save

        user_2 = create_user(
          username: unique_name('user'),
          email:    unique_email,
          password: 'clientex'
        )

        user_org = CartoDB::UserOrganization.new(organization.id, user_2.id)
        user_org.promote_user_to_admin
        organization.reload
        user_2.reload

        post "http://#{organization.name}.cartodb.test#{api_v1_visualizations_create_path(user_domain: user_2.username,
                                                                                 api_key: user_2.api_key)}",
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        pub_vis_id = JSON.parse(last_response.body).fetch('id')

        put "http://#{organization.name}.cartodb.test#{api_v1_visualizations_update_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key,
                                                                               id: pub_vis_id)}",
            {
              id: pub_vis_id,
              privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
            }.to_json, @headers
        last_response.status.should == 200

        post "http://#{organization.name}.cartodb.test#{api_v1_visualizations_create_path(user_domain: user_2.username,
                                                                                api_key: user_2.api_key)}",
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        priv_vis_id = JSON.parse(last_response.body).fetch('id')

        put "http://#{organization.name}.cartodb.test#{api_v1_visualizations_update_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key,
                                                                               id: priv_vis_id)}",
            {
              id: priv_vis_id,
              privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
            }.to_json, @headers
        last_response.status.should == 200

        get "http://#{organization.name}.cartodb.test#{api_v1_visualizations_index_path(user_domain: user_2.username,
                                                                               type: 'derived')}", @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 1
        vis = body['visualizations'].first
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase


        get "http://#{organization.name}.cartodb.test#{api_v1_visualizations_index_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key,
                                                                               type: 'derived',
                                                                               order: 'updated_at')}", {}, @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 2
        vis = body['visualizations'][0]
        vis['id'].should eq priv_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE.upcase
        vis = body['visualizations'][1]
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase

        user_2.destroy
      end
    end

    describe 'GET /api/v1/viz' do
      before(:each) do
        bypass_named_maps
        delete_user_data(@user_1)
      end

      it 'retrieves a collection of visualizations' do
        payload = factory(@user_1)
        post api_v1_visualizations_create_url(api_key: @api_key), payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.first.fetch('id').should == id
      end

      it 'is updated after creating a visualization' do
        payload = factory(@user_1)
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.size.should == 1

        payload = factory(@user_1).merge('name' => 'another one')
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.size.should == 2
      end

      it 'is updated after deleting a visualization' do
        payload = factory(@user_1)
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.should_not be_empty

        delete api_v1_visualizations_destroy_url(id: id, api_key: @api_key),
               { id: id }.to_json,
               @headers
        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.should be_empty
      end

      it 'paginates results' do
        per_page      = 10
        total_entries = 20

        total_entries.times do
          post api_v1_visualizations_index_url(api_key: @api_key),
            factory(@user_1).to_json, @headers
        end

        get api_v1_visualizations_index_url(api_key: @api_key, page: 1, per_page: per_page), {}, @headers

        last_response.status.should == 200

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should == per_page
        response.fetch('total_entries').should == total_entries
      end

      it 'returns filtered results' do
        post api_v1_visualizations_create_url(api_key: @api_key),
          factory(@user_1).to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'table'),
          {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.should be_empty

        post api_v1_visualizations_create_url(api_key: @api_key),
          factory(@user_1).to_json, @headers
        post api_v1_visualizations_create_url(api_key: @api_key),
          factory(@user_1).merge(type: 'table').to_json, @headers
        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived'),
          {}, @headers

        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.size.should == 2
      end

      it 'creates a visualization from a list of tables' do
        bypass_named_maps
        table1 = table_factory
        table2 = table_factory
        table3 = table_factory

        payload = {
          name: 'new visualization',
          tables: [
            table1.fetch('name'),
            table2.fetch('name'),
            table3.fetch('name')
          ],
          privacy: 'public'
        }

        post api_v1_visualizations_create_url(api_key: @api_key),
              payload.to_json, @headers
        last_response.status.should == 200

        visualization = JSON.parse(last_response.body)

        # TODO: this endpoint doesn't exist now. Current replacement?
        #get "/api/v1/viz/#{visualization.fetch('id')}/viz?api_key=#{@api_key}",
        #  {}, @headers
        #last_response.status.should == 403

        get api_v2_visualizations_vizjson_url(id: visualization.fetch('id'), api_key: @api_key),
          {}, @headers
        last_response.status.should == 200

        # include overlays

        get overlays_url(visualization_id: visualization.fetch('id'), api_key: @api_key),
          {}, @headers
        last_response.status.should == 200
        overlays = JSON.parse(last_response.body)
        overlays.length.should == 5
      end

    end

    describe 'GET /api/v1/viz/:id' do
      before(:each) do
        @carto_user1.private_maps_enabled = true
        @carto_user1.save

        bypass_named_maps
        delete_user_data(@user_1)
        @map, @table, @table_visualization, @visualization = create_full_builder_vis(@carto_user1,
                                                                                     visualization_attributes:
                                                                                       {
                                                                                         tags: ['foo'],
                                                                                         description: 'dull desc'
                                                                                       })
      end

      after(:each) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      it 'returns a visualization' do
        get api_v1_visualizations_show_url(id: @visualization.id, api_key: @api_key), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)

        response.fetch('id')              .should_not be_nil
        response.fetch('map_id')          .should_not be_nil
        response.fetch('tags')            .should_not be_empty
        response.fetch('description')     .should_not be_nil
        response.fetch('related_tables')  .should_not be_nil

        # Optional information
        response['likes'].should eq nil
      end

      it 'returns a specific error for password-protected visualizations and required, public information' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
        @visualization.password = 'wadus'
        @visualization.save!
        @visualization.user.update_attribute(:google_maps_key, 'waaaaadus')

        expected_visualization_info = {
          privacy: @visualization.privacy,
          user: {
            google_maps_query_string: @visualization.user.google_maps_query_string
          }
        }

        get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
          response.status.should eq 403
          response.body[:errors].should eq "Visualization not viewable"
          response.body[:errors_cause].should eq "privacy_password"
          response.body[:visualization].should eq expected_visualization_info
        end
      end

      it 'doesn\'t return a specific error for private visualizations' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save!

        get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
          response.status.should eq 403
          response.body[:errors].should eq "Visualization not viewable"
          response.body[:errors_cause].should be_nil
        end
      end

      it 'returns a visualization with optional information if requested' do
        url = api_v1_visualizations_show_url(
          id: @visualization.id,
          api_key: @api_key,
          show_liked: true
        )

        get url, {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)

        response['liked'].should eq false
      end

      it 'returns related_canonical_visualizations if requested' do
        get_json api_v1_visualizations_show_url(id: @visualization.id, api_key: @carto_user1.api_key) do |response|
          response.status.should eq 200
          response.body[:related_canonical_visualizations].should be_nil
        end

        get_json api_v1_visualizations_show_url(id: @visualization.id,
                                                api_key: @carto_user1.api_key,
                                                fetch_related_canonical_visualizations: true) do |response|
          response.status.should eq 200
          related_canonical = response.body[:related_canonical_visualizations]
          related_canonical.should_not be_nil
          related_canonical.count.should eq 1
          related_canonical[0][:id].should eq @table_visualization.id
        end
      end

      it 'returns private related_canonical_visualizations for users that can see it' do
        related_canonical_visualizations = @visualization.related_canonical_visualizations
        related_canonical_visualizations.should_not be_empty
        old_privacies = related_canonical_visualizations.map(&:privacy)
        related_canonical_visualizations.each do |v|
          v.update_attribute(:privacy, Carto::Visualization::PRIVACY_PRIVATE)
        end

        get_json api_v1_visualizations_show_url(id: @visualization.id,
                                                api_key: @carto_user1.api_key,
                                                fetch_related_canonical_visualizations: true) do |response|
          response.status.should eq 200
          related_canonical = response.body[:related_canonical_visualizations]
          related_canonical.count.should eq related_canonical_visualizations.count
          response.body[:related_canonical_visualizations_count].should eq related_canonical_visualizations.count
        end

        related_canonical_visualizations.zip(old_privacies).each do |v, p|
          v.update_attribute(:privacy, p)
        end
      end

      it 'returns private information about the user if requested' do
        url = api_v1_visualizations_show_url(id: @visualization.id, api_key: @carto_user1.api_key)
        get_json url do |response|
          response.status.should eq 200
          response.body[:user].should be_nil
        end

        get_json url, fetch_user: true do |response|
          response.status.should eq 200
          user = response.body[:user]
          user.should_not be_nil
          user[:avatar_url].should_not be_nil
          user[:quota_in_bytes].should_not be_nil
        end
      end

      describe 'user db connectivity issues' do
        before(:each) do
          @actual_database_name = @visualization.user.database_name
          @visualization.user.update_attribute(:database_name, 'wadus')
        end

        after(:each) do
          @visualization.user.update_attribute(:database_name, @actual_database_name)
        end

        it 'does not need connection to the user db if the viewer is the owner' do
          Rails.logger.expects(:warning).never
          Rails.logger.expects(:error).never

          get_json api_v1_visualizations_show_url(id: @visualization.id),
                   api_key: @visualization.user.api_key,
                   fetch_related_canonical_visualizations: true,
                   fetch_user: true,
                   show_liked: true,
                   show_permission: true,
                   show_auth_tokens: true,
                   show_stats: true do |response|
            response.status.should == 200
          end
        end
      end

      describe 'to anonymous users' do
        it 'returns a 403 on private visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
          @visualization.save!

          get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
            response.status.should eq 403
            expect(response.body[:errors]).to eq('Visualization not viewable')
          end
        end

        describe 'publically accessible visualizations' do
          before(:each) do
            @visualization.privacy = Carto::Visualization::PRIVACY_LINK
            @visualization.save!
          end

          it 'returns 403 for unpublished visualizations' do
            @visualization.published?.should eq false

            get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
              response.status.should eq 403
              expect(response.body[:errors]).to eq('Visualization not viewable')
            end
          end

          it 'returns 403 for unpublished and password protected visualizations' do
            @visualization.published?.should eq false
            @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
            @visualization.password = 'wadus'
            @visualization.save!

            get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
              response.status.should eq 403
              expect(response.body[:errors]).to eq('Visualization not viewable')
            end
          end

          describe 'published visualizations' do
            before(:each) do
              @visualization.create_mapcap!
              @visualization.published?.should eq true
            end

            it 'only returns public information' do
              get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
                response.status.should eq 200
                response.body[:name].should_not be_nil
                response.body[:updated_at].should_not be_nil
                response.body[:tags].should_not be_nil
                response.body[:title].should_not be_nil
                response.body[:description].should_not be_nil

                # Optional information requiring parameters
                response.body[:user].should eq nil
                response.body[:liked].should eq nil
                response.body[:stats].should be_empty
                response.body[:auth_tokens].should be_empty
                response.body[:permission].should eq nil
              end
            end

            it 'only returns public information, including optional if requested' do
              url = api_v1_visualizations_show_url(
                id: @visualization.id,
                show_liked: true,
                show_permission: true,
                show_auth_tokens: true,
                show_stats: true,
                fetch_user: true,
                show_user_basemaps: true
              )

              get_json url do |response|
                response.status.should eq 200
                response.body[:user].should_not be_nil
                response.body[:liked].should eq false
                response.body[:stats].should_not be_empty

                response_user = response.body[:user]
                response_user[:basemaps].should be_nil # Even if requested, because it's not public

                permission = response.body[:permission]
                permission.should_not eq nil
                permission[:owner].should_not eq nil
                owner = permission[:owner]
                user = @visualization.permission.owner
                owner[:name].should eq user.name
                owner[:last_name].should eq user.last_name
                owner[:username].should eq user.username
                owner[:avatar_url].should eq user.avatar_url
                owner[:base_url].should eq user.public_url
                owner[:org_admin].should eq user.org_admin
                owner[:org_user].should eq user.organization_id.present?
              end
            end

            it 'not only returns public information for authenticated requests' do
              url = api_v1_visualizations_show_url(
                id: @visualization.id,
                fetch_user: true,
                show_user_basemaps: true,
                api_key: @visualization.user.api_key
              )

              get_json url do |response|
                response.status.should eq 200
                response.body[:user].should_not be_nil

                response_user = response.body[:user]
                response_user[:basemaps].should_not be_empty
              end
            end

            it 'returns auth_tokens for password protected visualizations if correct password is provided' do
              password = 'wadus'
              @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
              @visualization.password = password
              @visualization.save!

              get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
                response.status.should eq 403
                expect(response.body[:errors]).to eq('Visualization not viewable')
              end

              get_json api_v1_visualizations_show_url(id: @visualization.id, password: password * 2) do |response|
                response.status.should eq 403
                expect(response.body[:errors]).to eq('Visualization not viewable')
              end

              get_json api_v1_visualizations_show_url(id: @visualization.id, password: password) do |response|
                response.status.should eq 200
                response.body[:auth_tokens].should_not be_nil
              end
            end

            it 'returns auth_tokens for password protected visualizations if requested by the owner' do
              get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
                response.status.should eq 200
                response.body[:auth_tokens].should_not be_nil
              end
            end

            it 'returns public information about the user if requested' do
              get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
                response.status.should eq 200
                response.body[:user].should be_nil
              end

              get_json api_v1_visualizations_show_url(id: @visualization.id), fetch_user: true do |response|
                @visualization.user.update_attribute(:google_maps_key, 'waaaaadus')

                response.status.should eq 200
                user = response.body[:user]
                user.should_not be_nil
                user[:avatar_url].should_not be_nil
                user[:quota_in_bytes].should be_nil
                user[:google_maps_query_string].should_not be_nil
                user[:google_maps_query_string].should eq @visualization.user.google_maps_query_string
              end
            end

            it 'returns related_canonical_visualizations if requested' do
              get_json api_v1_visualizations_show_url(id: @visualization.id) do |response|
                response.status.should eq 200
                response.body[:related_canonical_visualizations].should be_nil
              end

              get_json api_v1_visualizations_show_url(id: @visualization.id,
                                                      fetch_related_canonical_visualizations: true) do |response|
                response.status.should eq 200
                related_canonical = response.body[:related_canonical_visualizations]
                related_canonical.should_not be_nil
                related_canonical.count.should eq 1
                related_canonical[0][:id].should eq @table_visualization.id
              end
            end

            it 'doesn\'t return private related_canonical_visualizations' do
              related_canonical_visualizations = @visualization.related_canonical_visualizations
              related_canonical_visualizations.should_not be_empty
              old_privacies = related_canonical_visualizations.map(&:privacy)
              related_canonical_visualizations.each do |v|
                v.update_attribute(:privacy, Carto::Visualization::PRIVACY_PRIVATE)
              end

              get_json api_v1_visualizations_show_url(id: @visualization.id,
                                                      fetch_related_canonical_visualizations: true) do |response|
                response.status.should eq 200
                related_canonical = response.body[:related_canonical_visualizations]
                related_canonical.count.should eq 0
                response.body[:related_canonical_visualizations_count].should eq related_canonical_visualizations.count
              end

              related_canonical_visualizations.zip(old_privacies).each do |v, p|
                v.update_attribute(:privacy, p)
              end
            end

            describe 'user db connectivity issues' do
              before(:each) do
                @actual_database_name = @visualization.user.database_name
                @visualization.user.update_attribute(:database_name, 'wadus')
              end

              after(:each) do
                @visualization.user.update_attribute(:database_name, @actual_database_name)
              end

              it 'does not need connection to the user db if viewer is anonymous' do
                Rails.logger.expects(:warning).never
                Rails.logger.expects(:error).never
                get_json api_v1_visualizations_show_url(id: @visualization.id),
                         fetch_related_canonical_visualizations: true,
                         fetch_user: true,
                         show_liked: true,
                         show_permission: true,
                         show_stats: true do |response|
                  response.status.should == 200
                end
              end
            end
          end
        end
      end
    end

    describe 'filters' do
      before(:each) do
        bypass_named_maps
        delete_user_data(@user_1)
      end

      it 'uses locked filter' do
        bypass_named_maps

        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user_1, locked: true).to_json, @headers
        vis_1_id = JSON.parse(last_response.body).fetch('id')
        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user_1, locked: false).to_json, @headers
        vis_2_id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived'), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 2

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived', locked: true), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 1
        collection.first.fetch('id').should eq vis_1_id

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived', locked: false), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 1
        collection.first.fetch('id').should eq vis_2_id
      end

      it 'searches by tag' do
        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user_1, locked: true, tags: ['test1']).to_json, @headers
        vis_1_id = JSON.parse(last_response.body).fetch('id')
        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user_1, locked: false, tags: ['test2']).to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key, tags: 'test1'), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 1
        collection.first['id'].should == vis_1_id
      end

      context 'only_published' do
        before(:each) do
          carto_user = Carto::User.find(@user_1.id)
          unpublished_attrs = { privacy: Carto::Visualization::PRIVACY_PUBLIC, version: 3 }
          _, _, _, @unpublished_viz = create_full_visualization(carto_user, visualization_attributes: unpublished_attrs)
          published_attrs = { privacy: Carto::Visualization::PRIVACY_PUBLIC }
          _, _, _, @published_viz = create_full_visualization(carto_user, visualization_attributes: published_attrs)
        end

        after(:each) do
          @unpublished_viz.destroy
          @published_viz.destroy
        end

        it 'filters with only_published = true' do
          get api_v1_visualizations_index_url(api_key: @api_key, only_published: true), {}, @headers
          last_response.status.should == 200
          response    = JSON.parse(last_response.body)
          collection  = response.fetch('visualizations')
          collection.length.should eq 1
          collection.first['id'].should == @published_viz.id
        end

        it 'does not filter without it' do
          get api_v1_visualizations_index_url(api_key: @api_key), {}, @headers
          last_response.status.should == 200
          response    = JSON.parse(last_response.body)
          collection  = response.fetch('visualizations')
          collection.length.should eq 2
        end
      end

    end

    describe 'non existent visualization' do
      TEST_UUID = '00000000-0000-0000-0000-000000000000'.freeze

      it 'returns 404' do
        get api_v1_visualizations_show_url(id: TEST_UUID, api_key: @api_key), {}, @headers
        last_response.status.should == 404

        put api_v1_visualizations_update_url(id: TEST_UUID, api_key: @api_key), { id: TEST_UUID }.to_json, @headers
        last_response.status.should == 404

        delete api_v1_visualizations_destroy_url(id: TEST_UUID, api_key: @api_key), { id: TEST_UUID }.to_json, @headers
        last_response.status.should == 404
      end
    end

    describe '/api/v1/viz/:id/watching' do
      before(:all) do
        @user_1_1 = create_test_user
        @user_1_2 = create_test_user

        organization = test_organization
        organization.save

        user_org = CartoDB::UserOrganization.new(organization.id, @user_1_1.id)
        user_org.promote_user_to_admin
        @user_1_1.reload

        @user_1_2.organization = organization
        @user_1_2.save.reload
      end

      it 'returns an empty array if no other user is watching' do
        Carto::Visualization::Watcher.any_instance.stubs(:list).returns([])

        bypass_named_maps

        login(@user_1_1)
        post api_v1_visualizations_create_url(api_key: @user_1_1.api_key), factory(@user_1_1, locked: true).to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        login(@user_1_1)
        get api_v1_visualizations_notify_watching_url(id: id, api_key: @user_1_1.api_key)
        body = JSON.parse(last_response.body)

        expect(body).to eq([])
      end
    end

    describe '#destroy' do
      include_context 'organization with users helper'

      def destroy_url(user, vis_id)
        api_v1_visualizations_destroy_url(id: vis_id, user_domain: user.username, api_key: user.api_key)
      end

      it 'returns 404 for nonexisting visualizations' do
        delete_json(destroy_url(@carto_org_user_1, random_uuid)) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'returns 404 for not-accesible visualizations' do
        other_visualization = create(:carto_visualization, user: @carto_org_user_2)
        delete_json(destroy_url(@carto_org_user_1, other_visualization.id)) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'returns 403 for not-owned visualizations' do
        other_visualization = create(:carto_visualization, user: @carto_org_user_2)
        share_visualization_with_user(other_visualization, @carto_org_user_1)
        delete_json(destroy_url(@carto_org_user_1, other_visualization.id)) do |response|
          expect(response.status).to eq 403
        end
      end

      it 'returns 403 for viewer users' do
        visualization = create(:carto_visualization, user: @carto_org_user_1)
        @carto_org_user_1.update_attribute(:viewer, true)
        delete_json(destroy_url(@carto_org_user_1, visualization.id)) do |response|
          expect(response.status).to eq 403
        end
        @carto_org_user_1.update_attribute(:viewer, false)
      end

      it 'destroys a visualization by id' do
        visualization = create(:carto_visualization, user: @carto_org_user_1)
        delete_json(destroy_url(@carto_org_user_1, visualization.id)) do |response|
          expect(response.status).to eq 204
        end
      end

      it 'destroys a visualization by name' do
        visualization = create(:carto_visualization, user: @carto_org_user_1)
        delete_json(destroy_url(@carto_org_user_1, visualization.name)) do |response|
          expect(response.status).to eq 204
        end
      end

      it 'destroys a visualization and all of its dependencies (fully dependent)' do
        _, _, table_visualization, visualization = create_full_visualization(@carto_org_user_1)

        expect_visualization_to_be_destroyed(visualization) do
          expect_visualization_to_be_destroyed(table_visualization) do
            delete_json(destroy_url(@carto_org_user_1, table_visualization.id)) do |response|
              expect(response.status).to eq 204
            end
          end
        end
      end

      it 'destroys a visualization and affected layers (partially dependent)' do
        _, _, table_visualization, visualization = create_full_visualization(@carto_org_user_1)
        visualization.layers << create(:carto_layer)
        visualization.data_layers.count.should eq 2

        expect_visualization_to_be_destroyed(table_visualization) do
          delete_json(destroy_url(@carto_org_user_1, table_visualization.id)) do |response|
            expect(response.status).to eq 204
          end
        end

        expect(Carto::Visualization.exists?(visualization.id)).to be_true
        visualization.reload
        visualization.data_layers.count.should eq 1
      end
    end

    describe '#update' do
      after(:each) do
        @carto_user1.private_maps_enabled = false
        @carto_user1.public_map_quota = nil
        @carto_user1.public_dataset_quota = nil
        @carto_user1.private_map_quota = nil
        @carto_user1.save
      end

      it 'returns a 200 response when making a map public with enough quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.public_map_quota = nil
        @carto_user1.save
        visualization = create(:carto_visualization, user: @carto_user1,
                                                                 privacy: Carto::Visualization::PRIVACY_PRIVATE)

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers

        last_response.status.should == 200
        visualization.destroy!
      end

      it 'returns a 403 response when making a map public without enough quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.public_map_quota = 0
        @carto_user1.save
        visualization = create(:carto_visualization, user: @carto_user1,
                                                                 privacy: Carto::Visualization::PRIVACY_PRIVATE)

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers

        last_response.status.should == 403
        last_response.body.should =~ /public map quota/
      end

      it 'returns a 200 response when making a dataset public with enough quota' do
        @carto_user1.public_dataset_quota = nil
        @carto_user1.private_tables_enabled = true
        @carto_user1.save
        user_table = create(:carto_user_table, :full, user: @carto_user1,
                                        privacy: Carto::Visualization::PRIVACY_PRIVATE)
        visualization = user_table.visualization

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers

        last_response.status.should == 200
        visualization.destroy!
      end

      it 'returns a 403 response when making a dataset public without enough quota' do
        @carto_user1.public_dataset_quota = 0
        @carto_user1.private_tables_enabled = true
        @carto_user1.save
        user_table = create(:carto_user_table, :full, user: @carto_user1,
                                        privacy: Carto::Visualization::PRIVACY_PRIVATE)
        visualization = user_table.visualization

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers

        last_response.status.should == 403
        last_response.body.should =~ /public dataset quota/
      end

      it 'returns a 200 response when making a map private with enough quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.private_map_quota = nil
        @carto_user1.save
        visualization = create(:carto_visualization, user: @carto_user1,
                                                                 privacy: Carto::Visualization::PRIVACY_PUBLIC)

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE }.to_json,
            @headers

        last_response.status.should == 200
        visualization.destroy!
      end

      it 'returns a 403 response when making a map private without enough quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.private_map_quota = 0
        @carto_user1.save
        visualization = create(:carto_visualization, user: @carto_user1,
                                                                 privacy: Carto::Visualization::PRIVACY_PUBLIC)

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE }.to_json,
            @headers

        last_response.status.should == 403
        last_response.body.should =~ /private map quota/
      end

      it 'returns a 200 response when making a table public without enough map quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.private_tables_enabled = true
        @carto_user1.public_map_quota = 0
        @carto_user1.save
        user_table = create(:carto_user_table, :with_db_table, user_id: @carto_user1.id)
        map = create(:carto_map)
        user_table.map = map
        user_table.save!
        visualization = create(:carto_visualization,
                                           type: Carto::Visualization::TYPE_CANONICAL,
                                           map: map,
                                           user: @carto_user1,
                                           privacy: Carto::Visualization::PRIVACY_PRIVATE)

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers

        last_response.status.should == 200
        visualization.destroy!
      end
    end
  end
end
