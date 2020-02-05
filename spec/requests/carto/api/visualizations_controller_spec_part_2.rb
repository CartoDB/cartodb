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

      @user_1 = FactoryGirl.create(:valid_user)
      @carto_user1 = Carto::User.find(@user_1.id)
      @user_2 = FactoryGirl.create(:valid_user, private_maps_enabled: true)
      @carto_user2 = Carto::User.find(@user_2.id)
      @api_key = @user_1.api_key
    end

    before(:each) do
      begin
        delete_user_data @user_1
      rescue => exception
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

      organization = test_organization.save

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
            type: CartoDB::Permission::TYPE_USER,
            entity: {
              id:   user_2.id,
            },
            access: CartoDB::Permission::ACCESS_READONLY
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
      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_t_1_perm_id),
          {acl: [{
                   type: CartoDB::Permission::TYPE_USER,
                   entity: {
                     id:   user_2.id,
                   },
                   access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers
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

    context 'visualization likes endpoints' do
      before(:each) do
        @map, @table, @table_visualization, @map_visualization = create_full_visualization(@carto_user1, visualization_attributes: { version: nil, privacy: Carto::Visualization::PRIVACY_PUBLIC })
        @vis = FactoryGirl.create(:carto_visualization, user: @carto_user1)
        @vis_user2 = FactoryGirl.create(:carto_visualization, user: @carto_user2)
        @user_domain = @carto_user1.username
        @user_domain2 = @carto_user2.username
      end

      after(:each) do
        destroy_full_visualization(@map, @table, @table_visualization, @map_visualization)
      end

      describe 'POST add_like' do
        it 'triggers error 403 if not authenticated' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: 'foo')
          expect(last_response.status).to eq(403)
        end

        it 'triggers error 403 if dont have at least read permission' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis_user2.id, api_key: 'foo')
          expect(last_response.status).to eq(403)
        end

        it 'add likes to a given visualization' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
        end

        it 'returns an error if you try to like twice a visualization' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)

          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(400)
          expect(JSON.parse(last_response.body)['text']).to eq("You've already favorited this visualization")
        end
      end

      describe 'POST remove_like' do
        it 'triggers error 403 if not authenticated' do
          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain, id: @vis.id, api_key: 'foo')
          expect(last_response.status).to eq(403)
        end

        it 'triggers error 403 if you dont have at least read permission' do
          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain, id: @vis_user2.id, api_key: 'foo')
          expect(last_response.status).to eq(403)
        end

        it 'removes a like from a given visualization' do
          @vis.add_like_from(@carto_user1)

          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)

          get api_v1_visualizations_show_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key, show_liked: true)
          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('liked')).to eq(false)
        end

        it 'does not returns error if you try to remove a non-existent like' do
          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key, show_liked: true)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('liked')).to eq(false)
        end
      end
    end


    describe 'tests visualization likes endpoints in organizations' do
      include_context 'organization with users helper'

      describe 'PUT notify_watching' do
        it 'adds the user to the watching list' do
          vis = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1)
          user_domain = @carto_org_user_1.username

          put api_v1_visualizations_notify_watching_url(user_domain: user_domain, id: vis.id, api_key: @carto_org_user_1.api_key)
          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body)).to eq([@carto_org_user_1.username])
        end

        it 'returns 403 if user does not have read permissions on the visualization' do
          private_vis = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1, privacy: Carto::Visualization::PRIVACY_PRIVATE)

          put api_v1_visualizations_notify_watching_url(user_domain: @carto_org_user_2.username, id: private_vis.id, api_key: @carto_org_user_2.api_key)
          expect(last_response.status).to eq(403)
        end
      end

      describe 'GET list_watching' do
        it 'returns the users currently on the watching list' do
          vis = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1)
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
          private_vis = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1, privacy: Carto::Visualization::PRIVACY_PRIVATE)

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
        put api_v1_permissions_update_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: u2_vis_1_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_ORGANIZATION,
                       entity: {
                           id:   @organization.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 2
        body['total_shared'].should eq 1
        body['total_locked'].should eq 0

        # Share u2 vis2 with u1
        put api_v1_permissions_update_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: u2_vis_2_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_USER,
                       entity: {
                           id:   @org_user_1.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers
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
        put api_v1_permissions_update_url(user_domain:@org_user_2.username, api_key: @org_user_2.api_key, id: u2_t_1_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_ORGANIZATION,
                       entity: {
                           id:   @organization.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 2
        body['total_shared'].should eq 1
        body['total_locked'].should eq 0

        # Share u2 table2 with org
        put api_v1_permissions_update_url(user_domain:@org_user_2.username, api_key: @org_user_2.api_key, id: u2_t_2_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_USER,
                       entity: {
                           id:   @org_user_1.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers

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

        organization = test_organization.save

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

      # This is a contrast to the anonymous use case. A public endpoint shouldn't hit the user DB to avoid
      # workers locks if user DB is under heavy load. Nevertheless, the private one can (and needs).
      describe 'user db connectivity issues' do
        before(:each) do
          @actual_database_name = @visualization.user.database_name
          @visualization.user.update_attribute(:database_name, 'wadus')
        end

        after(:each) do
          @visualization.user.update_attribute(:database_name, @actual_database_name)
        end

        it 'needs connection to the user db if the viewer is the owner' do
          CartoDB::Logger.expects(:error).once.with do |e|
            e[:exception].message.should eq "FATAL:  database \"#{@visualization.user.database_name}\" does not exist\n"
          end

          get_json api_v1_visualizations_show_url(id: @visualization.id),
                   api_key: @visualization.user.api_key,
                   fetch_related_canonical_visualizations: true,
                   fetch_user: true,
                   show_liked: true,
                   show_permission: true,
                   show_auth_tokens: true,
                   show_stats: true do |response|
            # We currently log 404 on errors. Maybe something that we should change in the future...
            response.status.should == 404
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
                CartoDB::Logger.expects(:warning).never
                CartoDB::Logger.expects(:error).never
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

    # Specific tests for vizjson 3. Common are at `vizjson_shared_examples`
    describe '#vizjson3' do
      include Fixtures::Layers::Infowindows
      include Fixtures::Layers::Tooltips
      include Carto::Factories::Visualizations

      include_context 'visualization creation helpers'

      def get_vizjson3_url(user, visualization)
        args = { user_domain: user.username, id: visualization.id, api_key: user.api_key }
        api_v3_visualizations_vizjson_url(args)
      end

      def first_layer_definition_from_response(response)
        index = response.body[:layers].index { |l| l[:options] && l[:options][:layer_definition] }
        response.body[:layers][index][:options][:layer_definition]
      end

      def first_layer_named_map_from_response(response)
        index = response.body[:layers].index { |l| l[:options] && l[:options][:named_map] }
        response.body[:layers][index][:options][:named_map]
      end

      def first_data_layer_from_response(response)
        index = response.body[:layers].index { |l| l[:type] == 'CartoDB' }
        response.body[:layers][index]
      end

      let(:infowindow) do
        FactoryGirl.build_stubbed(:carto_layer_with_infowindow).infowindow
      end

      let(:tooltip) do
        FactoryGirl.build_stubbed(:carto_layer_with_tooltip).tooltip
      end

      before(:each) do
        @map, @table, @table_visualization, @visualization = create_full_visualization(Carto::User.find(@user_1.id))

        @table.privacy = UserTable::PRIVACY_PUBLIC
        @table.save
        layer = @visualization.data_layers.first
        layer.infowindow = infowindow
        layer.tooltip = tooltip
        layer.options[:table_name] = @table.name
        layer.options[:query] = "select * from #{@table.name}"
        layer.save
      end

      after(:each) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      describe 'layer templates' do
        describe 'anonymous maps' do
          before(:each) do
            @table.privacy = UserTable::PRIVACY_PUBLIC
            @table.save
          end

          it 'uses v3 infowindows and tooltips templates removing "table/views/" from template_name' do
            # vizjson v2 doesn't change
            get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                       id: @visualization.id,
                                                       api_key: @user_1.api_key), @headers do |response|
              response.status.should eq 200

              layer_definition = first_layer_definition_from_response(response)
              response_infowindow = layer_definition[:layers][0][:infowindow]
              response_infowindow[:template_name].should eq infowindow[:template_name]
              response_infowindow[:template].should include(v2_infowindow_light_template_fragment)
              response_infowindow[:template].should_not include(v3_infowindow_light_template_fragment)

              response_tooltip = layer_definition[:layers][0][:tooltip]
              response_tooltip[:template_name].should eq tooltip[:template_name]
              response_tooltip[:template].should include(v2_tooltip_light_template_fragment)
              response_tooltip[:template].should_not include(v3_tooltip_light_template_fragment)

            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer = first_data_layer_from_response(response)
              response_infowindow = layer[:infowindow]
              infowindow[:template_name].should eq "table/views/infowindow_light"
              response_infowindow[:template_name].should eq "infowindow_light"
              response_infowindow[:template].should include(v3_infowindow_light_template_fragment)
              response_infowindow[:template].should_not include(v2_infowindow_light_template_fragment)

              response_tooltip = layer[:tooltip]
              response_tooltip[:template_name].should eq tooltip[:template_name]
              response_tooltip[:template].should include(v3_tooltip_light_template_fragment)
              response_tooltip[:template].should_not include(v2_tooltip_light_template_fragment)
            end
          end
        end

        describe 'named maps' do
          before(:each) do
            @user_1.private_tables_enabled = true
            @user_1.save
            @table.user.reload
            @table.privacy = UserTable::PRIVACY_PRIVATE
            @table.save!
          end

          it 'uses v3 infowindows templates at named maps removing "table/views/" from template_name' do
            # vizjson v2 doesn't change
            get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                       id: @visualization.id,
                                                       api_key: @user_1.api_key), @headers do |response|
              response.status.should eq 200

              layer_named_map = first_layer_named_map_from_response(response)
              response_infowindow = layer_named_map[:layers][0][:infowindow]
              response_infowindow[:template_name].should eq infowindow[:template_name]
              response_infowindow[:template].should include(v2_infowindow_light_template_fragment)
              response_infowindow[:template].should_not include(v3_infowindow_light_template_fragment)

              response_tooltip = layer_named_map[:layers][0][:tooltip]
              response_tooltip[:template_name].should eq tooltip[:template_name]
              response_tooltip[:template].should include(v2_tooltip_light_template_fragment)
              response_tooltip[:template].should_not include(v3_tooltip_light_template_fragment)
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer = first_data_layer_from_response(response)
              response_infowindow = layer[:infowindow]
              infowindow[:template_name].should eq "table/views/infowindow_light"
              response_infowindow[:template_name].should eq 'infowindow_light'
              response_infowindow[:template].should include(v3_infowindow_light_template_fragment)
              response_infowindow[:template].should_not include(v2_infowindow_light_template_fragment)

              response_tooltip = layer[:tooltip]
              response_tooltip[:template_name].should eq tooltip[:template_name]
              response_tooltip[:template].should include(v3_tooltip_light_template_fragment)
              response_tooltip[:template].should_not include(v2_tooltip_light_template_fragment)
            end
          end
        end
      end

      describe 'layer custom infowindows and tooltips' do
        before(:each) do
          layer = @visualization.data_layers.first
          layer.infowindow = custom_infowindow
          layer.tooltip = custom_tooltip
          layer.save
        end

        describe 'anonymous maps' do
          before(:each) do
            @table.privacy = UserTable::PRIVACY_PUBLIC
            @table.save
          end

          it 'uses v3 infowindows and tooltips templates' do
            # vizjson v2 doesn't change
            get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                       id: @visualization.id,
                                                       api_key: @user_1.api_key), @headers do |response|
              response.status.should eq 200

              layer_definition = first_layer_definition_from_response(response)
              response_infowindow = layer_definition[:layers][0][:infowindow]
              response_infowindow[:template_name].should eq ''
              response_infowindow[:template].should eq custom_infowindow[:template]

              response_tooltip = layer_definition[:layers][0][:tooltip]
              response_tooltip[:template_name].should eq ''
              response_tooltip[:template].should eq custom_tooltip[:template]
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer = first_data_layer_from_response(response)
              response_infowindow = layer[:infowindow]
              response_infowindow[:template_name].should eq ''
              response_infowindow[:template].should eq custom_infowindow[:template]

              response_tooltip = layer[:tooltip]
              response_tooltip[:template_name].should eq ''
              response_tooltip[:template].should eq custom_tooltip[:template]
            end
          end
        end

        describe 'named maps' do
          before(:each) do
            @user_1.private_tables_enabled = true
            @user_1.save
            @table.user.reload
            @table.privacy = UserTable::PRIVACY_PRIVATE
            @table.save
          end

          it 'uses v3 infowindows templates at named maps' do
            # vizjson v2 doesn't change
            get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                       id: @visualization.id,
                                                       api_key: @user_1.api_key), @headers do |response|
              response.status.should eq 200

              layer_named_map = first_layer_named_map_from_response(response)
              response_infowindow = layer_named_map[:layers][0][:infowindow]
              response_infowindow[:template_name].should eq ''
              response_infowindow[:template].should eq custom_infowindow[:template]

              response_tooltip = layer_named_map[:layers][0][:tooltip]
              response_tooltip[:template_name].should eq ''
              response_tooltip[:template].should eq custom_tooltip[:template]
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer = first_data_layer_from_response(response)
              response_infowindow = layer[:infowindow]
              response_infowindow[:template_name].should eq ''
              response_infowindow[:template].should eq custom_infowindow[:template]

              response_tooltip = layer[:tooltip]
              response_tooltip[:template_name].should eq ''
              response_tooltip[:template].should eq custom_tooltip[:template]
            end
          end
        end
      end

      it 'returns a vizjson with empty widgets array for visualizations without widgets' do
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3.keys.should include(:widgets)
          vizjson3[:widgets].should == []
        end
      end

      it 'returns visualization widgets' do
        layer = @visualization.layers.first
        widget = FactoryGirl.create(:widget, layer: layer)

        widget2 = FactoryGirl.create(:widget_with_layer, type: 'fake')

        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:widgets].length.should == 1

          vizjson3[:widgets].map { |w| w[:type] }.should include(widget.type)
          vizjson3[:widgets].map { |w| w[:layer_id] }.should include(layer.id)

          widget2.destroy
          widget.destroy
        end
      end

      it 'returns datasource' do
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:datasource][:user_name].should == @user_1.username
          vizjson3[:datasource][:maps_api_template].should_not be_nil
          vizjson3[:datasource][:stat_tag].should_not be_nil

          vizjson3[:user][:fullname].should == (@user_1.name.nil? ? @user_1.username : @user_1.name)
          vizjson3[:user][:avatar_url].should_not be_nil
        end
      end

      it 'returns datasource.template_name for visualizations with retrieve_named_map? true' do
        Carto::Visualization.any_instance.stubs(:retrieve_named_map?).returns(true)
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:datasource][:template_name].should_not be_nil
        end
      end

      it 'returns nil datasource.template_name for visualizations with retrieve_named_map? false' do
        Carto::Visualization.any_instance.stubs(:retrieve_named_map?).returns(false)
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:datasource].key?(:template_name).should be_false
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

        organization = test_organization.save

        user_org = CartoDB::UserOrganization.new(organization.id, @user_1_1.id)
        user_org.promote_user_to_admin
        @user_1_1.reload

        @user_1_2.organization_id = organization.id
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

    describe 'legacy controller migration' do
      before(:all) do
        @user = create_user
      end

      after(:all) do
        bypass_named_maps
        @user.destroy
      end

      before(:each) do
        bypass_named_maps
        # bypass_metrics

        host! "#{@user.username}.localhost.lan"
      end

      after(:each) do
        bypass_named_maps
        delete_user_data @user
      end

      describe '#create' do
        describe '#duplicate map' do
          before(:all) do
            @other_user = create_user
          end

          before(:each) do
            bypass_named_maps

            @map = Map.create(user_id: @user.id)
            @visualization = FactoryGirl.create(:derived_visualization,
                                                map_id: @map.id,
                                                user_id: @user.id,
                                                privacy: Visualization::Member::PRIVACY_PRIVATE)
          end

          after(:each) do
            @map.destroy
          end

          after(:all) do
            @other_user.destroy
          end

          it 'duplicates a map' do
            new_name = @visualization.name + ' patatas'

            post_json api_v1_visualizations_create_url(api_key: @user.api_key),
                      source_visualization_id: @visualization.id,
                      name: new_name

            last_response.status.should be_success

            Carto::Visualization.exists?(user_id: @user.id, type: 'derived', name: new_name).should be_true
          end

          it 'registers table dependencies for duplicated maps' do
            map, table, table_visualization, visualization = create_full_visualization(Carto::User.find(@user.id))
            new_name = visualization.name + ' registered'

            post_json api_v1_visualizations_create_url(api_key: @user.api_key),
                      source_visualization_id: visualization.id,
                      name: new_name

            last_response.status.should be_success

            visualization = Carto::Visualization.where(user_id: @user.id, type: 'derived', name: new_name).first
            visualization.should be
            visualization.data_layers.first.user_tables.count.should eq 1

            destroy_full_visualization(map, table, table_visualization, visualization)
          end

          it "duplicates someone else's map if has at least read permission to it" do
            new_name = @visualization.name + ' patatas'

            Carto::Visualization.any_instance.stubs(:is_viewable_by_user?).returns(true)

            post_json api_v1_visualizations_create_url(user_domain: @other_user.username, api_key: @other_user.api_key),
                      source_visualization_id: @visualization.id,
                      name: new_name

            last_response.status.should be_success

            Carto::Visualization.exists?(user_id: @other_user.id, type: 'derived', name: new_name).should be_true
          end

          it "doesn't duplicate someone else's map without permission" do
            new_name = @visualization.name + ' patatatosky'

            post_json api_v1_visualizations_create_url(user_domain: @other_user.username, api_key: @other_user.api_key),
                      source_visualization_id: @visualization.id,
                      name: new_name

            last_response.status.should == 403

            Carto::Visualization.exists?(user_id: @other_user.id, type: 'derived', name: new_name).should be_false
          end
        end

        describe 'map creation from datasets' do
          include_context 'organization with users helper'
          include TableSharing

          it 'creates a visualization from a dataset given the viz id' do
            table1 = create_table(user_id: @org_user_1.id)
            payload = {
              source_visualization_id: table1.table_visualization.id,
              visChanges: 0,
              name: "untitled_table_XXX_map"
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch

              v.user_id.should eq @org_user_1.id
              v.map.user_id.should eq @org_user_1.id
            end
          end

          it 'does not create visualizations if user is viewer' do
            table1 = create_table(user_id: @org_user_1.id)
            payload = {
              source_visualization_id: table1.table_visualization.id,
              visChanges: 0,
              name: "untitled_table_XXX_map"
            }

            @org_user_1.viewer = true
            @org_user_1.save

            post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                      payload) do |response|
              response.status.should eq 403
            end

            @org_user_1.viewer = false
            @org_user_1.save
          end

          it 'creates a visualization from a dataset given the table id' do
            table1 = create_table(user_id: @org_user_1.id)
            payload = {
              tables: [table1.name]
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch

              v.user_id.should eq @org_user_1.id
              v.map.user_id.should eq @org_user_1.id
            end
          end

          it 'correctly creates a visualization from two dataset of different users' do
            table1 = create_table(user_id: @org_user_1.id)
            table2 = create_table(user_id: @org_user_2.id)
            share_table_with_user(table1, @org_user_2)
            payload = {
              type: 'derived',
              tables: ["#{@org_user_1.username}.#{table1.name}", table2.name]
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch

              v.user_id.should eq @org_user_2.id
              v.map.user_id.should eq @org_user_2.id
            end
          end

          describe 'builder and editor behaviour' do
            before(:all) do
              @old_builder_enabled = @org_user_1.builder_enabled
            end

            after(:all) do
              @org_user_1.builder_enabled = @old_builder_enabled
              @org_user_1.save
            end

            describe 'for editor users' do
              before(:all) do
                @org_user_1.builder_enabled = false
                @org_user_1.save
              end

              it 'copies the styles' do
                table1 = create_table(user_id: @org_user_1.id)
                payload = {
                  tables: [table1.name]
                }
                post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                          payload) do |response|
                  response.status.should eq 200
                  vid = response.body[:id]
                  v = CartoDB::Visualization::Member.new(id: vid).fetch
                  original_layer = table1.map.data_layers.first
                  layer = v.map.data_layers.first
                  layer.options['tile_style'].should eq original_layer.options['tile_style']
                end
              end

              it 'doesn\'t add style properties' do
                table1 = create_table(user_id: @org_user_1.id)
                payload = {
                  tables: [table1.name]
                }
                post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                          payload) do |response|
                  response.status.should eq 200
                  vid = response.body[:id]
                  v = CartoDB::Visualization::Member.new(id: vid).fetch

                  layer = v.map.data_layers.first
                  layer.options['style_properties'].should be_nil
                end
              end
            end

            describe 'for builder users' do
              before(:all) do
                @org_user_1.builder_enabled = true
                @org_user_1.save
              end

              it 'resets the styles' do
                table1 = create_table(user_id: @org_user_1.id)
                Table.any_instance.stubs(:geometry_types).returns(['ST_Point'])
                payload = {
                  tables: [table1.name]
                }
                post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                          payload) do |response|
                  response.status.should eq 200
                  vid = response.body[:id]
                  v = CartoDB::Visualization::Member.new(id: vid).fetch

                  original_layer = table1.map.data_layers.first
                  layer = v.map.data_layers.first
                  layer.options['tile_style'].should_not eq original_layer.options['tile_style']
                end
              end

              it 'adds style properties' do
                table1 = create_table(user_id: @org_user_1.id)
                Table.any_instance.stubs(:geometry_types).returns(['ST_Point'])
                payload = {
                  tables: [table1.name]
                }
                post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                          payload) do |response|
                  response.status.should eq 200
                  vid = response.body[:id]
                  v = CartoDB::Visualization::Member.new(id: vid).fetch

                  layer = v.map.data_layers.first
                  layer.options['style_properties'].should_not be_nil
                end
              end
            end
          end

          it 'rewrites queries for other user datasets' do
            table1 = create_table(user_id: @org_user_1.id)
            layer = table1.map.data_layers.first
            layer.options['query'] = "SELECT * FROM #{table1.name} LIMIT 1"
            layer.save
            share_table_with_user(table1, @org_user_2)
            payload = {
              type: 'derived',
              tables: ["#{@org_user_1.username}.#{table1.name}"]
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch
              layer = v.map.data_layers.first
              layer.options['query'].should eq "SELECT * FROM #{@org_user_1.username}.#{table1.name} LIMIT 1"
            end
          end

          it 'does not rewrite queries for same user datasets' do
            table1 = create_table(user_id: @org_user_1.id)
            layer = table1.map.data_layers.first
            layer.options['query'] = "SELECT * FROM #{table1.name} LIMIT 1"
            layer.save
            share_table_with_user(table1, @org_user_1)
            payload = {
              type: 'derived',
              tables: ["#{@org_user_1.username}.#{table1.name}"]
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch
              new_layer = v.map.data_layers.first
              new_layer.options['query'].should eq layer.options['query']
            end
          end

          it 'sets table privacy if the user has private_maps' do
            table1 = create_table(user_id: @org_user_1.id)
            payload = {
              tables: [table1.name]
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch
              v.privacy.should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE
            end
          end

          it 'sets PUBLIC privacy if the user doesn\'t have private_maps' do
            @carto_org_user_2.update_column(:private_maps_enabled, false) # Direct to DB to skip validations
            table1 = create_table(user_id: @org_user_2.id)
            payload = {
              tables: [table1.name]
            }
            post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                      payload) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = CartoDB::Visualization::Member.new(id: vid).fetch
              v.privacy.should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC
            end
          end

          it 'enables scrollwheel zoom by default' do
            table1 = create_table(user_id: @org_user_2.id)
            table1.map.scrollwheel = false
            table1.map.options[:scrollwheel] = false
            table1.map.save

            post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                      tables: [table1.name]) do |response|
              response.status.should eq 200
              vid = response.body[:id]
              v = Carto::Visualization.find(vid)
              v.map.scrollwheel.should eq true
              v.map.options[:scrollwheel].should eq true
            end
          end
        end
      end

      describe "#update" do
        before(:each) do
          login(@user)
        end

        it "Does not update visualizations if user is viewer" do
          table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

          @user.viewer = true
          @user.save

          payload = { id: table.table_visualization.id, privacy: Carto::Visualization::PRIVACY_PRIVATE }
          put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
            response.status.should eq 403
          end

          @user.viewer = false
          @user.save

          table.destroy
        end

        it "Updates changes even if named maps communication fails" do
          @user.private_tables_enabled = true
          @user.save

          table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

          Carto::NamedMaps::Api.any_instance.stubs(:create).raises('fake named maps failure')

          payload = { id: table.table_visualization.id, privacy: Carto::Visualization::PRIVACY_PRIVATE }
          put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
            response.status.should be_success
          end

          table.reload
          table.privacy.should eq ::UserTable::PRIVACY_PRIVATE

          table.destroy

          @user.private_tables_enabled = false
          @user.save
        end

        it 'filters attributes' do
          table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

          table.table_visualization.description.should_not eq "something"

          payload = { id: table.table_visualization.id, description: "something", fake: "NO!" }
          put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
            response.status.should be_success
          end

          table.reload
          table.table_visualization.description.should eq "something"

          table.destroy
        end

        it "renames datasets" do
          table = new_table(user_id: @user.id).save.reload

          payload = { id: table.table_visualization.id, name: 'vis_rename_test1' }
          put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
            response.status.should be_success
          end

          table.reload
          table.name.should eq 'vis_rename_test1'

          table.destroy
        end

        it 'sets password protection' do
          visualization = FactoryGirl.create(:carto_visualization, user_id: @user.id)
          visualization.password_protected?.should be_false

          payload = {
            id: visualization.id,
            password: 'the_pass',
            privacy: Carto::Visualization::PRIVACY_PROTECTED
          }
          put_json api_v1_visualizations_update_url(id: visualization.id), payload do |response|
            response.status.should be_success
          end

          visualization.reload
          visualization.password_protected?.should be_true
          visualization.password_valid?('the_pass').should be_true

          visualization.destroy
        end

        it 'migrates visualizations to v3' do
          _, _, _, visualization = create_full_visualization(@user)
          visualization.update_attributes!(version: 2)
          visualization.analyses.each(&:destroy)

          payload = {
            id: visualization.id,
            version: 3
          }
          put_json api_v1_visualizations_update_url(id: visualization.id), payload do |response|
            response.status.should be_success
            expect(response.body[:version]).to eq 3
          end

          visualization.reload
          expect(visualization.analyses.any?).to be_true

          visualization.destroy
        end
      end
    end

    describe '#destroy' do
      include_context 'organization with users helper'
      include TableSharing

      def destroy_url(user, vis_id)
        api_v1_visualizations_destroy_url(id: vis_id, user_domain: user.username, api_key: user.api_key)
      end

      it 'returns 404 for nonexisting visualizations' do
        delete_json(destroy_url(@carto_org_user_1, random_uuid)) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'returns 404 for not-accesible visualizations' do
        other_visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_2)
        delete_json(destroy_url(@carto_org_user_1, other_visualization.id)) do |response|
          expect(response.status).to eq 404
        end
      end

      it 'returns 403 for not-owned visualizations' do
        other_visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_2)
        share_visualization_with_user(other_visualization, @carto_org_user_1)
        delete_json(destroy_url(@carto_org_user_1, other_visualization.id)) do |response|
          expect(response.status).to eq 403
        end
      end

      it 'returns 403 for viewer users' do
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1)
        @carto_org_user_1.update_attribute(:viewer, true)
        delete_json(destroy_url(@carto_org_user_1, visualization.id)) do |response|
          expect(response.status).to eq 403
        end
        @carto_org_user_1.update_attribute(:viewer, false)
      end

      it 'destroys a visualization by id' do
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1)
        delete_json(destroy_url(@carto_org_user_1, visualization.id)) do |response|
          expect(response.status).to eq 204
        end
      end

      it 'destroys a visualization by name' do
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_1)
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
        visualization.layers << FactoryGirl.create(:carto_layer)
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
        @carto_user1.private_map_quota = nil
        @carto_user1.save
      end

      it 'returns a 200 response when making a map public with enough quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.public_map_quota = nil
        @carto_user1.save
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_user1,
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
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_user1,
                                                                 privacy: Carto::Visualization::PRIVACY_PRIVATE)

        request_params = { user_domain: @carto_user1.username, api_key: @carto_user1.api_key, id: visualization.id }
        put api_v1_visualizations_update_url(request_params),
            { id: visualization.id, privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC }.to_json,
            @headers

        last_response.status.should == 403
        last_response.body.should =~ /public map quota/
      end

      it 'returns a 200 response when making a map private with enough quota' do
        @carto_user1.private_maps_enabled = true
        @carto_user1.private_map_quota = nil
        @carto_user1.save
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_user1,
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
        visualization = FactoryGirl.create(:carto_visualization, user: @carto_user1,
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
        @carto_user1.public_map_quota = 0
        @carto_user1.save
        user_table = FactoryGirl.create(:carto_user_table, :with_db_table, user_id: @carto_user1.id)
        map = FactoryGirl.create(:carto_map)
        user_table.map = map
        user_table.save!
        visualization = FactoryGirl.create(:carto_visualization,
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

  describe 'index' do
    include_context 'visualization creation helpers'

    before(:all) do
      @headers = {'CONTENT_TYPE'  => 'application/json'}
    end

    before(:each) do
      @user = FactoryGirl.create(:valid_user)
      login(@user)
    end

    after(:each) do
      @user.destroy
    end

    it 'mixed types search should filter only remote without display name' do
      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'table').to_json, @headers
      vis_1_id = JSON.parse(last_response.body).fetch('id')

      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', name: 'visu2', display_name: 'visu2').to_json, @headers
      vis_2_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_2_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1,
        size: 200).save

      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', name: 'visu3').to_json, @headers
      vis_3_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_3_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1,
        size: 200).save

      get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'remote,table'), {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 2
      [vis_1_id, vis_2_id].include?(collection[0]['id']).should eq true
      [vis_1_id, vis_2_id].include?(collection[1]['id']).should eq true
    end

    context 'with_dependent_visualizations' do
      before(:each) do
        table_a = create_random_table(@user)
        @visualization_a = table_a.table_visualization
        Delorean.time_travel_to "2018/01/01 00:00:00" do
          @dependencies = Array.new(3) do
            Delorean.jump(1.day)
            FactoryGirl.create(:carto_visualization, user_id: @user.id)
          end
        end
        Carto::Visualization.any_instance.stubs(:dependent_visualizations).returns(@dependencies)
      end

      it 'does not return the dependent visualizations by default' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                            order: 'dependent_visualizations'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 1
        collection[0]['dependent_visualizations_count'].should be_nil
        collection[0]['dependent_visualizations'].should be_nil
      end

      it 'does not return the dependent visualizations if with_dependent_visualizations = 0' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                            with_dependent_visualizations: 0), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 1
        collection[0]['dependent_visualizations_count'].should be_nil
        collection[0]['dependent_visualizations'].should be_nil
      end

      it 'returns the 2 most recent dependent visualizations when with_dependent_visualizations = 2' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                            with_dependent_visualizations: 2), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 1
        collection[0]['dependent_visualizations_count'].should eql 3
        collection[0]['dependent_visualizations'].length.should eq 2
        collection[0]['dependent_visualizations'].first['id'].should eql @dependencies[2].id
        collection[0]['dependent_visualizations'].first['name'].should_not be_nil
        collection[0]['dependent_visualizations'].second['id'].should eql @dependencies[1].id
        collection[0]['dependent_visualizations'].second['name'].should_not be_nil
      end
    end

    context 'ordering' do

      it 'returns the expected status' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: ''), {}, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(
          api_key: @user.api_key,
          types: 'derived',
          order: '',
          page: '',
          per_page: ''
        ), {}, @headers
        last_response.status.should == 200

        ['derived', 'slide'].each do |type|
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: type, order: :mapviews), {}, @headers
          last_response.status.should == 200
        end

        ['remote', 'table'].each do |type|
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: type, order: :size), {}, @headers
          last_response.status.should == 200
        end

        ['derived', 'remote', 'slide', 'table'].each do |type|
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: type, order: :whatever), {}, @headers
          last_response.status.should == 400
          JSON.parse(last_response.body).fetch('error').should_not be_nil
        end
      end

      it 'orders descending by default' do
        visualization_a = FactoryGirl.create(:carto_visualization, name: 'Visualization A', user_id: @user.id).store
        visualization_b = FactoryGirl.create(:carto_visualization, name: 'Visualization B', user_id: @user.id).store

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'name'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_b.id
        collection[1]['id'].should eq visualization_a.id
      end

      it 'orders by name' do
        visualization_a = FactoryGirl.create(:carto_visualization, name: 'Visualization A', user_id: @user.id).store
        visualization_b = FactoryGirl.create(:carto_visualization, name: 'Visualization B', user_id: @user.id).store

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'name',
                                            order_direction: 'asc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_a.id
        collection[1]['id'].should eq visualization_b.id
      end

      it 'orders by favorited' do
        visualization_a = FactoryGirl.create(:carto_visualization, user_id: @user.id).store
        visualization_b = FactoryGirl.create(:carto_visualization, user_id: @user.id).store
        visualization_a.add_like_from(@user)

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', with_dependent_visualizations: 10,
                                            order: 'favorited', order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_a.id
        collection[1]['id'].should eq visualization_b.id
      end

      it 'orders by size' do
        vis1 = factory(@user, locked: true, type: 'remote', display_name: 'visu1')
        post api_v1_visualizations_create_url(api_key: @user.api_key), vis1.to_json, @headers
        vis1_id = JSON.parse(last_response.body).fetch('id')
        Carto::ExternalSource.new(
          visualization_id: vis1_id,
          import_url: 'http://www.fake.com',
          rows_counted: 1,
          size: 100
        ).save

        vis2 = factory(@user, locked: true, type: 'remote', display_name: 'visu2')
        post api_v1_visualizations_create_url(api_key: @user.api_key), vis2.to_json, @headers
        vis2_id = JSON.parse(last_response.body).fetch('id')
        Carto::ExternalSource.new(
          visualization_id: vis2_id,
          import_url: 'http://www.fake.com',
          rows_counted: 1,
          size: 200
        ).save

        vis3 = factory(@user, locked: true, type: 'remote', display_name: 'visu3')
        post api_v1_visualizations_create_url(api_key: @user.api_key), vis3.to_json, @headers
        vis3_id = JSON.parse(last_response.body).fetch('id')
        Carto::ExternalSource.new(
          visualization_id: vis3_id,
          import_url: 'http://www.fake.com',
          rows_counted: 1, size: 10
        ).save

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'remote', order: 'size'), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 3
        collection[0]['id'].should == vis2_id
        collection[1]['id'].should == vis1_id
        collection[2]['id'].should == vis3_id
      end

      xit 'orders by estimated row count' do
        visualization_a = FactoryGirl.create(:carto_visualization, user_id: @user.id)
        table = FactoryGirl.create(:table, user_id: @user.id)
        table.insert_row!(name: 'name1')
        table.update_table_pg_stats
        visualization_b = FactoryGirl.create(:carto_visualization, user_id: @user.id, map_id: table.map_id)

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'estimated_row_count',
                                            order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_b.id
        collection[1]['id'].should eq visualization_a.id
      end

      it 'orders by privacy' do
        link_privacy = Carto::Visualization::PRIVACY_LINK
        public_privacy = Carto::Visualization::PRIVACY_PUBLIC
        visualization_a = FactoryGirl.create(:carto_visualization, user_id: @user.id, privacy: link_privacy).store
        visualization_b = FactoryGirl.create(:carto_visualization, user_id: @user.id, privacy: public_privacy).store

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'privacy',
                                            order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_b.id
        collection[1]['id'].should eq visualization_a.id
      end

      it 'orders by dependent visualizations' do
        table_a = create_random_table(@user)
        visualization_a = table_a.table_visualization
        dependent_visualization = FactoryGirl.create(:carto_visualization, user_id: @user.id)
        dependent_visualization.map = FactoryGirl.create(:carto_map, user_id: @user.id)
        dependent_visualization.save!
        layer = FactoryGirl.build(:carto_layer)
        layer.options[:table_name] = table_a.name
        layer.save!
        dependent_visualization.layers << layer
        table_b = create_random_table(@user)
        visualization_b = table_b.table_visualization

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table', order: 'dependent_visualizations',
                                            with_dependent_visualizations: 10,
                                            order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_a.id
        collection[1]['id'].should eq visualization_b.id
      end

      context 'by search rank' do
        before(:each) do
          @visualization_a = FactoryGirl.create(:carto_visualization, name: 'Best rank', user_id: @user.id).store
          @visualization_b = FactoryGirl.create(:carto_visualization, name: 'Another rank, but not the best',
                                                                      user_id: @user.id).store
        end

        it 'orders results by search rank when searching' do
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived',
                                              q: 'Best rank'), {}, @headers

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 2
          collection[0]['id'].should eq @visualization_a.id
          collection[1]['id'].should eq @visualization_b.id
        end

        it 'ignores other ordering parameters' do
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', q: 'Best rank',
                                              order: 'name', order_direction: 'asc'), {}, @headers

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 2
          collection[0]['id'].should eq @visualization_a.id
          collection[1]['id'].should eq @visualization_b.id
        end
      end

      context 'error handling' do
        before(:each) do
          @valid_order = 'updated_at'
          @invalid_order = 'invalid_order'
          @valid_order_direction = 'asc'
          @invalid_order_direction = 'invalid_order_direction'
          @valid_order_combination = 'name,updated_at'
          @invalid_order_combination = 'size,updated_at'
          @valid_direction_combination = 'asc,desc'
          @invalid_direction_combination = 'asc,invalid'
        end

        it 'returns an error if an invalid :order is given' do
          get api_v1_visualizations_index_url(order: @valid_order, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order: @invalid_order, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order' parameter value"
        end

        it 'returns an error if an invalid :order_direction is given' do
          get api_v1_visualizations_index_url(order_direction: @valid_order_direction, order: @valid_order,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order_direction: @invalid_order_direction, order: @valid_order,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order_direction' parameter value"
        end

        it 'returns an error if an invalid :order combination is given' do
          get api_v1_visualizations_index_url(order: @valid_order_combination, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order: @invalid_order_combination, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order' parameter combination"
        end

        it 'returns an error if an invalid :order_direction combination is given' do
          get api_v1_visualizations_index_url(order: @valid_order_combination,
                                              order_direction: @valid_direction_combination,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order: @valid_order_combination,
                                              order_direction: @invalid_direction_combination,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order_direction' parameter combination"
        end
      end
    end
  end

  describe 'index' do
    include_context 'organization with users helper'
    include_context 'visualization creation helpers'

    describe 'shared_only' do
      it 'should not display nor count the shared visualizations you own' do
        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_1.id)
        u1_t_1_id = table.table_visualization.id
        u1_t_1_perm_id = table.table_visualization.permission.id

        share_table_with_organization(table, @org_user_1, @organization)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
                                            shared: CartoDB::Visualization::Collection::FILTER_SHARED_ONLY), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 0
        body['visualizations'].count.should eq 0
      end
    end

    it 'returns auth tokens for password protected viz for the owner but not for users that have them shared' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_org_user_1)
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.password = 'wontbeused'
      @visualization.save!

      share_visualization(@visualization, @org_user_2)

      get_json api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                               type: Carto::Visualization::TYPE_DERIVED,
                                               shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers do |response|
        response.status.should eq 200
        response.body[:visualizations][0][:id].should_not be_empty
        response.body[:visualizations][0][:auth_tokens].should_not be_empty
      end

      get_json api_v1_visualizations_index_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key,
                                               type: Carto::Visualization::TYPE_DERIVED,
                                               shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers do |response|
        response.status.should eq 200
        response.body[:visualizations][0][:id].should_not be_empty
        response.body[:visualizations][0][:auth_tokens].should be_empty
      end

      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end
  end

  describe 'visualization url generation' do
    include_context 'visualization creation helpers'
    include_context 'organization with users helper'

    before(:all) do
      @user = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'generates a user table visualization url' do
      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @user.id)
      vis_id = table.table_visualization.id

      get_json api_v1_visualizations_show_url(user_domain: @user.username, id: vis_id, api_key: @user.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@user.username}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/tables/#{table.name}"
      end
    end

    it 'generates a user map url' do
      visualization = api_visualization_creation(@user, http_json_headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
      get_json api_v1_visualizations_show_url(user_domain: @user.username, id: visualization.id, api_key: @user.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@user.username}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/viz/#{visualization.id}/map"
      end
    end

    it 'generates a org user table visualization url' do
      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_1.id)
      vis_id = table.table_visualization.id

      get_json api_v1_visualizations_show_url(user_domain: @org_user_1.username, id: vis_id, api_key: @org_user_1.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@org_user_1.organization.name}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/u/#{@org_user_1.username}/tables/#{table.name}"
      end
    end

    it 'generates a organization user map url' do
      visualization = api_visualization_creation(@org_user_1, http_json_headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
      get_json api_v1_visualizations_show_url(user_domain: @org_user_1.username, id: visualization.id, api_key: @org_user_1.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@org_user_1.organization.name}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/u/#{@org_user_1.username}/viz/#{visualization.id}/map"
      end
    end

    it 'generates the URL for tables shared by another user with hyphens in their username' do
      user_with_hyphen = FactoryGirl.create(:user, username: 'fulano-de-tal', organization: @organization)
      table = create_random_table(user_with_hyphen, 'tabluca', UserTable::PRIVACY_PRIVATE)
      shared_table = table.table_visualization
      share_visualization(shared_table, @org_user_1)

      request_url = api_v1_visualizations_show_url(user_domain: @org_user_1.username,
                                                   id: shared_table.id, api_key: @org_user_1.api_key)
      get_json request_url, {}, http_json_headers do |response|
        response.status.should == 200
        response.body[:url].should include("/tables/fulano-de-tal.tabluca")
      end
    end
  end
end
