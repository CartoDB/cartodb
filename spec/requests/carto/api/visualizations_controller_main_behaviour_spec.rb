# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'
require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

# TODO: Remove once Carto::Visualization is complete enough
require_relative '../../../../app/models/visualization/member'
require_relative '../../../../app/helpers/bounding_box_helper'
require_relative './vizjson_shared_examples'
require 'helpers/unique_names_helper'

describe Carto::Api::VisualizationsController do
  include UniqueNamesHelper
  it_behaves_like 'visualization controllers' do
  end

  TEST_UUID = '00000000-0000-0000-0000-000000000000'

  DATE_ATTRIBUTES = %w{ created_at updated_at }
  NORMALIZED_ASSOCIATION_ATTRIBUTES = {
    attributes: DATE_ATTRIBUTES,
    associations: {
      'permission' => {
        attributes: DATE_ATTRIBUTES,
        associations: {}
      },
      'table' => {
        attributes: DATE_ATTRIBUTES,
        associations: {}
      }
    }
  }

  NEW_ATTRIBUTES = {
    attributes: [],
    associations: {
      'table' => {
        attributes: [],
        associations: {
          'permission' => {
            attributes: [],
            associations: {
              'owner' => {
                attributes: [ 'email', 'quota_in_bytes', 'db_size_in_bytes', 'public_visualization_count',
                'all_visualization_count', 'table_count' ],
                associations: {}
              }
            }
          }
        }
      },
      'permission' => {
        attributes: [],
        associations: {
          'owner' => {
            attributes: [ 'email', 'quota_in_bytes', 'db_size_in_bytes', 'public_visualization_count',
            'all_visualization_count', 'table_count' ],
            associations: {}
          }
        }
      }
    }
  }

  BBOX_GEOM = '{"type":"MultiPolygon","coordinates":[[[[-75.234375,54.57206166],[4.921875,54.36775852],[7.03125,-0.35156029],[-71.71875,1.75753681],[-75.234375,54.57206166]]]]}'
  OUTSIDE_BBOX_GEOM = '{"type":"MultiPolygon","coordinates":[[[[-149.4140625,79.74993208],[-139.921875,79.74993208],[-136.0546875,78.13449318],[-148.7109375,78.06198919],[-149.4140625,79.74993208]]]]}'

  describe 'main behaviour' do
    # INFO: this tests come from spec/requests/api/visualizations_spec.rb

    before(:all) do
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    end

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      @db = Rails::Sequel.connection
      Sequel.extension(:pagination)

      CartoDB::Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)

      @user_1 = FactoryGirl.create(:valid_user)
      @user_2 = FactoryGirl.create(:valid_user, private_maps_enabled: true)

      @api_key = @user_1.api_key

      begin
        delete_user_data @user_1
      rescue => exception
        # Silence named maps problems only here upon data cleaning, not in specs
        raise unless exception.class.to_s == 'CartoDB::NamedMapsWrapper::HTTPResponseError'
      end

      @headers = {
        'CONTENT_TYPE'  => 'application/json',
      }
      host! "#{@user_1.username}.localhost.lan"
    end

    after(:each) do
      @user_1.destroy
      @user_2.destroy
    end

    it 'tests exclude_shared and only_shared filters' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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

    describe 'tests visualization likes endpoints' do
      include_context 'users helper'
      # TODO: currently new endpoint doesn't match this endpoint

      it 'tests like endpoints' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

        vis_1_id = create_visualization(@user_1).id

        get api_v1_visualizations_likes_count_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 0

        get api_v1_visualizations_likes_list_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        JSON.parse(last_response.body).fetch('likes').should eq []

        get api_v1_visualizations_is_liked_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)

        post api_v1_visualizations_add_like_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        get api_v1_visualizations_is_liked_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        JSON.parse(last_response.body).fetch('liked').should eq true

        get api_v1_visualizations_likes_count_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        get api_v1_visualizations_likes_list_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        JSON.parse(last_response.body).fetch('likes').should eq [{'actor_id' => @user_1.id}]

        post api_v1_visualizations_add_like_url(user_domain: @user_2.username, id: vis_1_id, api_key: @user_2.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 2

        get api_v1_visualizations_likes_list_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        # Careful with order of array items
        (JSON.parse(last_response.body).fetch('likes') - [
                                                           {'actor_id' => @user_1.id},
                                                           {'actor_id' => @user_2.id}
                                                         ]).should eq []

        delete api_v1_visualizations_remove_like_url(user_domain: @user_2.username, id: vis_1_id, api_key: @user_2.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        # No effect expected
        delete api_v1_visualizations_remove_like_url(user_domain: @user_2.username, id: vis_1_id, api_key: @user_2.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        post api_v1_visualizations_add_like_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        last_response.status.should == 400
        last_response.body.should eq "You've already liked this visualization"

        delete api_v1_visualizations_remove_like_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 0

        post api_v1_visualizations_add_like_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        get api_v1_visualizations_likes_list_url(user_domain: @user_1.username, id: vis_1_id, api_key: @user_1.api_key)
        JSON.parse(last_response.body).fetch('likes').should eq [{'actor_id' => @user_1.id}]
      end

    end

    describe 'tests visualization likes endpoints in organizations' do
      include_context 'organization with users helper'

      it 'tests totals calculations' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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
        body['total_likes'].should eq 0
        body['total_shared'].should eq 0
        vis = body['visualizations'].first
        vis['id'].should eq u1_t_1_id

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 1
        body['total_likes'].should eq 0
        body['total_shared'].should eq 0
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
        body['total_likes'].should eq 0
        body['total_shared'].should eq 1

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
        body['total_likes'].should eq 0
        body['total_shared'].should eq 2

        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_vis_1_id, api_key: @org_user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2

        # Multiple likes to same vis shouldn't increment total as is per vis
        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_vis_1_id, api_key: @org_user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2


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
        body['total_likes'].should eq 0
        body['total_shared'].should eq 1

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
        body['total_likes'].should eq 0
        body['total_shared'].should eq 2
        body['visualizations'][0]['table']['name'].should == "#{@org_user_2.database_schema}.#{u2_t_2.name}"

        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_t_1_id, api_key: @org_user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2

        # Multiple likes to same table shouldn't increment total as is per vis
        post api_v1_visualizations_add_like_url(user_domain: @org_user_1.username, id: u1_t_1_id, api_key: @org_user_2.api_key)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2
      end

    end

    describe 'index endpoint' do

      it 'tests normal users authenticated and unauthenticated calls' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
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
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
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
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user_1)
      end

      it 'returns a visualization' do
        payload = factory(@user_1)
        post api_v1_visualizations_create_url(api_key: @api_key),
        payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_show_url(id: id, api_key: @api_key), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)

        response.fetch('id')              .should_not be_nil
        response.fetch('map_id')          .should_not be_nil
        response.fetch('tags')            .should_not be_empty
        response.fetch('description')     .should_not be_nil
        response.fetch('related_tables')  .should_not be_nil
      end
    end

    # Specific tests for vizjson 3. Common are at `vizjson_shared_examples`
    describe '#vizjson3' do
      include Fixtures::Layers::Infowindows
      include Fixtures::Layers::Tooltips
      include Carto::Factories::Visualizations

      include_context 'visualization creation helpers'

      def get_vizjson3_url(user, visualization, vector: nil)
        args = { user_domain: user.username, id: visualization.id, api_key: user.api_key }
        args[:vector] = vector if vector
        api_v3_visualizations_vizjson_url(args)
      end

      def first_layer_definition_from_response(response)
        index = response.body[:layers].index { |l| l['options'] && l['options']['layer_definition'] }
        response.body[:layers][index]['options']['layer_definition']
      end

      def first_layer_named_map_from_response(response)
        index = response.body[:layers].index { |l| l['options'] && l['options']['named_map'] }
        response.body[:layers][index]['options']['named_map']
      end

      let(:infowindow) do
        JSON.parse(FactoryGirl.build_stubbed(:carto_layer_with_infowindow).infowindow)
      end

      let(:tooltip) do
        JSON.parse(FactoryGirl.build_stubbed(:carto_layer_with_tooltip).tooltip)
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

          it 'uses v3 infowindows and tooltips templates' do
            # vizjson v2 doesn't change
            get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                       id: @visualization.id,
                                                       api_key: @user_1.api_key), @headers do |response|
              response.status.should eq 200

              layer_definition = first_layer_definition_from_response(response)
              response_infowindow = layer_definition['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq infowindow['template_name']
              response_infowindow['template'].should include(v2_infowindow_light_template_fragment)
              response_infowindow['template'].should_not include(v3_infowindow_light_template_fragment)

              response_tooltip = layer_definition['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq tooltip['template_name']
              response_tooltip['template'].should include(v2_tooltip_light_template_fragment)
              response_tooltip['template'].should_not include(v3_tooltip_light_template_fragment)

            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer_definition = first_layer_definition_from_response(response)
              response_infowindow = layer_definition['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq infowindow['template_name']
              response_infowindow['template'].should include(v3_infowindow_light_template_fragment)
              response_infowindow['template'].should_not include(v2_infowindow_light_template_fragment)

              response_tooltip = layer_definition['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq tooltip['template_name']
              response_tooltip['template'].should include(v3_tooltip_light_template_fragment)
              response_tooltip['template'].should_not include(v2_tooltip_light_template_fragment)
            end
          end
        end

        describe 'named maps' do
          before(:each) do
            @user_1.private_tables_enabled = true
            @user_1.save
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
              response_infowindow = layer_named_map['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq infowindow['template_name']
              response_infowindow['template'].should include(v2_infowindow_light_template_fragment)
              response_infowindow['template'].should_not include(v3_infowindow_light_template_fragment)

              response_tooltip = layer_named_map['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq tooltip['template_name']
              response_tooltip['template'].should include(v2_tooltip_light_template_fragment)
              response_tooltip['template'].should_not include(v3_tooltip_light_template_fragment)
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer_named_map = first_layer_named_map_from_response(response)
              response_infowindow = layer_named_map['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq infowindow['template_name']
              response_infowindow['template'].should include(v3_infowindow_light_template_fragment)
              response_infowindow['template'].should_not include(v2_infowindow_light_template_fragment)

              response_tooltip = layer_named_map['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq tooltip['template_name']
              response_tooltip['template'].should include(v3_tooltip_light_template_fragment)
              response_tooltip['template'].should_not include(v2_tooltip_light_template_fragment)
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
              response_infowindow = layer_definition['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer_definition['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer_definition = first_layer_definition_from_response(response)
              response_infowindow = layer_definition['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer_definition['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
            end
          end
        end

        describe 'named maps' do
          before(:each) do
            @user_1.private_tables_enabled = true
            @user_1.save
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
              response_infowindow = layer_named_map['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer_named_map['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer_named_map = first_layer_named_map_from_response(response)
              response_infowindow = layer_named_map['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer_named_map['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
            end
          end
        end
      end

      describe 'torque layers' do
        it 'contains cartocss and sql instead of tile_style and query, and includes cartocss_version' do
          layer = @visualization.data_layers.first
          layer.kind = 'torque'
          layer.save

          tile_style_value = nil
          query_value = nil

          # vizjson v2 doesn't change
          get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username, id: @visualization.id, api_key: @user_1.api_key), @headers do |response|
            response.status.should eq 200
            vizjson = response.body
            layers = vizjson[:layers]
            layers.should_not be_empty
            torque_layers = layers.select { |l| l['type'] == 'torque' }
            torque_layers.count.should eq 1
            torque_layers.each do |l|
              options = l['options']

              options['cartocss'].should be_nil
              tile_style_value = options['tile_style']
              tile_style_value.should_not be_nil

              options['sql'].should be_nil
              query_value = options['query']
              query_value.should_not be_nil
            end
          end

          get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
            response.status.should eq 200
            vizjson = response.body
            layers = vizjson[:layers]
            layers.should_not be_empty
            torque_layers = layers.select { |l| l['type'] == 'torque' }
            torque_layers.count.should eq 1
            torque_layers.each do |l|
              options = l['options']

              options['tile_style'].should be_nil
              cartocss = options['cartocss']
              cartocss.should eq tile_style_value

              options['query'].should be_nil
              sql = options['sql']
              sql.should eq query_value
            end
          end

          layer.destroy
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

          vizjson3[:widgets].map { |w| w['type'] }.should include(widget.type)
          vizjson3[:widgets].map { |w| w['layer_id'] }.should include(layer.id)

          widget2.destroy
          widget.destroy
        end
      end

      it 'returns datasource' do
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:datasource]['user_name'].should == @user_1.username
          vizjson3[:datasource]['maps_api_template'].should_not be_nil
          vizjson3[:datasource]['stat_tag'].should_not be_nil

          vizjson3[:user]['fullname'].should == (@user_1.name.nil? ? @user_1.username : @user_1.name)
          vizjson3[:user]['avatar_url'].should_not be_nil
        end
      end

      it 'includes vector flag (default false)' do
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:vector].should == false
        end
      end

      it 'includes vector flag (true if requested)' do
        get_json get_vizjson3_url(@user_1, @visualization, vector: true), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:vector].should == true
        end
      end

      it 'returns datasource.template_name for visualizations with retrieve_named_map? true' do
        Carto::Visualization.any_instance.stubs(:retrieve_named_map?).returns(true)
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:datasource]['template_name'].should_not be_nil
        end
      end

      it 'returns nil datasource.template_name for visualizations with retrieve_named_map? false' do
        Carto::Visualization.any_instance.stubs(:retrieve_named_map?).returns(false)
        get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
          response.status.should == 200
          vizjson3 = response.body
          vizjson3[:datasource].has_key?('template_name').should be_false
        end
      end
    end

    describe 'tests visualization listing filters' do
      before(:each) do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user_1)
      end

      it 'uses locked filter' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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
        CartoDB::Visualization::Watcher.any_instance.stubs(:list).returns([])

        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

        login(@user_1_1)
        post api_v1_visualizations_create_url(api_key: @user_1_1.api_key), factory(@user_1_1, locked: true).to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        login(@user_1_1)
        get api_v1_visualizations_notify_watching_url(id: id, api_key: @user_1_1.api_key)
        body = JSON.parse(last_response.body)
        body.should == []
      end
    end

  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

  private

  # Custom hash comparison, since in the ActiveModel-based controllers
  # we allow some differences:
  # - x to many associations can return [] instead of nil
  def normalize_hash(h, normalized_attributes = NORMALIZED_ASSOCIATION_ATTRIBUTES)
    h.each { |k, v|
      h[k] = nil if v == []
      h[k] = '' if normalized_attributes[:attributes].include?(k)
      if normalized_attributes[:associations].keys.include?(k)
        normalize_hash(v, normalized_attributes[:associations][k])
      end
    }
  end

  # INFO: this test uses comparison against old data structures to check validity.
  # You can use this method to remove that new data so next comparisons will work.
  def remove_data_only_in_new_controllers(visualization_hash, new_attributes = NEW_ATTRIBUTES)
    visualization_hash.each { |k, v|
      if new_attributes[:attributes].include?(k)
        removed = visualization_hash.delete(k)
      elsif new_attributes[:associations].include?(k)
        remove_data_only_in_new_controllers(v, new_attributes[:associations][k])
      end
    }
  end

  def login(user)
    login_as(user, {scope: user.username })
    host! "#{user.username}.localhost.lan"
  end

  def base_url
    '/api/v1/viz'
  end

  def response_body(params=nil)
    get base_url, params, @headers
    last_response.status.should == 200
    body = JSON.parse(last_response.body)
    body['visualizations'] = body['visualizations'].map { |v| normalize_hash(v) }.map { |v| remove_data_only_in_new_controllers(v) }
    body
  end

  def factory(user, attributes={})
    visualization_template(user, attributes)
  end

  def table_factory(options={})
    create_table_with_options(@user_1, @headers, options)
  end

  def api_visualization_creation(user, headers, additional_fields = {})
    post api_v1_visualizations_create_url(user_domain: user.username, api_key: user.api_key), factory(user).merge(additional_fields).to_json, headers
    id = JSON.parse(last_response.body).fetch('id')
    id.should_not be_nil
    CartoDB::Visualization::Member.new(id: id).fetch
  end

  def test_organization
    organization = Organization.new
    organization.name = unique_name('org')
    organization.quota_in_bytes = 1234567890
    organization.seats = 5
    organization
  end

  def create_geometry_table(user, the_geom)
    table = new_table(privacy: UserTable::PRIVACY_PUBLIC, user_id: user.id)
    table.force_schema = "the_geom geometry"
    table.the_geom_type = "point"
    table.save.reload
    table.insert_row!(the_geom: the_geom)
    BoundingBoxHelper.update_visualizations_bbox(table)
    table
  end

end
