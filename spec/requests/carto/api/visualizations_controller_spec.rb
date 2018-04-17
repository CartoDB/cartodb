# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

# TODO: Remove once Carto::Visualization is complete enough
require_relative '../../../../app/models/visualization/member'
require_relative './vizjson_shared_examples'
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

  describe 'vizjson2 generator' do
    it_behaves_like 'vizjson generator' do
      def api_vx_visualizations_vizjson_url(options)
        api_v2_visualizations_vizjson_url(options)
      end

      def vizjson_vx_version
        '0.1.0'
      end

      def attributions_from_vizjson(visualization)
        visualization['layers'][1]['options']['attribution'].split(',').map(&:strip)
      end

      before(:each) do
        bypass_named_maps
      end

      it 'marks visualizations as using vizjson2' do
        visualization = FactoryGirl.create(:carto_visualization)
        Carto::Api::VisualizationsController.any_instance.stubs(:generate_vizjson2).returns({})
        get(
          api_v2_visualizations_vizjson_url(user_domain: visualization.user.username, id: visualization.id),
          {},
          'HTTP_REFERER' => 'http://wadus.com'
        )
        visualization.uses_vizjson2?.should be_true
      end

      it 'marks visualizations as using vizjson2 with invalid referer' do
        visualization = FactoryGirl.create(:carto_visualization)
        Carto::Api::VisualizationsController.any_instance.stubs(:generate_vizjson2).returns({})
        get(
          api_v2_visualizations_vizjson_url(user_domain: visualization.user.username, id: visualization.id),
          {},
          'HTTP_REFERER' => 'invalid'
        )
        visualization.uses_vizjson2?.should be_true
      end

      it 'marks visualizations as using vizjson2 without referer' do
        visualization = FactoryGirl.create(:carto_visualization)
        Carto::Api::VisualizationsController.any_instance.stubs(:generate_vizjson2).returns({})
        get api_v2_visualizations_vizjson_url(user_domain: visualization.user.username, id: visualization.id)
        visualization.uses_vizjson2?.should be_true
      end

      it 'does not mark visualizations as using vizjson2 with carto referer' do
        visualization = FactoryGirl.create(:carto_visualization)
        Carto::Api::VisualizationsController.any_instance.stubs(:generate_vizjson2).returns({})
        get(
          api_v2_visualizations_vizjson_url(user_domain: visualization.user.username, id: visualization.id),
          {},
          'HTTP_REFERER' => 'https://carto.com/wadus'
        )
        visualization.uses_vizjson2?.should be_false
      end
    end
  end

  describe 'vizjson3 generator' do
    it_behaves_like 'vizjson generator' do
      def api_vx_visualizations_vizjson_url(options)
        api_v3_visualizations_vizjson_url(options)
      end

      def vizjson_vx_version
        '3.0.0'
      end

      def attributions_from_vizjson(visualization)
        visualization['layers'].select { |l| l['type'] == 'CartoDB' }
                               .map { |l| l['options']['attribution'] }
                               .select(&:present?)
      end
    end
  end

  TEST_UUID = '00000000-0000-0000-0000-000000000000'.freeze

  DATE_ATTRIBUTES = %w{ created_at updated_at }.freeze
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
  }.freeze

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
                attributes: ['email', 'quota_in_bytes', 'db_size_in_bytes', 'public_visualization_count',
                             'all_visualization_count', 'table_count'],
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
            attributes: ['email', 'quota_in_bytes', 'db_size_in_bytes', 'public_visualization_count',
                         'all_visualization_count', 'table_count'],
            associations: {}
          }
        }
      }
    }
  }.freeze

  BBOX_GEOM = '{"type":"MultiPolygon","coordinates":[[[[-75.234375,54.57206166],[4.921875,54.36775852],[7.03125,-0.35156029],[-71.71875,1.75753681],[-75.234375,54.57206166]]]]}'.freeze
  OUTSIDE_BBOX_GEOM = '{"type":"MultiPolygon","coordinates":[[[[-149.4140625,79.74993208],[-139.921875,79.74993208],[-136.0546875,78.13449318],[-148.7109375,78.06198919],[-149.4140625,79.74993208]]]]}'.freeze

  describe 'static_map' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:all) do
      Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)

      @user_1 = FactoryGirl.create(:valid_user, private_tables_enabled: false)
      @table1 = create_random_table(@user_1)

      @headers = { 'CONTENT_TYPE' => 'application/json' }
      host! "#{@user_1.subdomain}.localhost.lan"
    end

    after(:all) do
      @user_1.destroy
    end

    it 'tests with non-existing cdn config, which uses maps_api_template url' do
      width = 123
      height = 456

      Carto::StaticMapsURLHelper.any_instance
                                .stubs(:get_cdn_config)
                                .returns(nil)
      ApplicationHelper.stubs(:maps_api_template)
                       .returns("http://#{@user_1.username}.localhost.lan:8181")

      get api_v2_visualizations_static_map_url(
        user_domain: @user_1.username,
        id: @table1.table_visualization.id,
        width: width,
        height: height), @headers
      last_response.status.should == 302

      tpl_id = Carto::NamedMaps::Template.new(Carto::Visualization.find(@table1.table_visualization.id)).name
      last_response.location.should == "http://#{@user_1.username}.localhost.lan:8181/api/v1/map/static/named/#{tpl_id}/#{width}/#{height}.png"
    end

    it 'tests with existing cdn config' do
      width = 123
      height = 456

      Carto::StaticMapsURLHelper.any_instance
                                .stubs(:get_cdn_config)
                                .returns("http" => "cdn.local.lan")

      get api_v2_visualizations_static_map_url(
        user_domain: @user_1.username,
        id: @table1.table_visualization.id,
        width: width,
        height: height
      ), @headers
      last_response.status.should == 302

      tpl_id = Carto::NamedMaps::Template.new(Carto::Visualization.find(@table1.table_visualization.id)).name
      last_response.location.should == "http://cdn.local.lan/#{@user_1.username}/api/v1/map/static/named/#{tpl_id}/#{width}/#{height}.png"
    end

    it 'tests privacy of static_maps calls' do
      # As privacy is equal to other visualizations controller methods, no need to test every option, just generally
      width = 123
      height = 456

      # By default no private tables so all are created public
      @user_1.private_tables_enabled = true
      @user_1.save

      private_table = create_random_table(@user_1)

      @user_1.private_tables_enabled = false
      @user_1.save

      Carto::StaticMapsURLHelper.any_instance
                                .stubs(:get_cdn_config)
                                .returns(nil)
      ApplicationHelper.stubs(:maps_api_template)
                       .returns("http://#{@user_1.username}.localhost.lan:8181")

      get api_v2_visualizations_static_map_url(
        user_domain: @user_1.username,
        id: @table1.table_visualization.id,
        width: width,
        height: height
      ), @headers
      last_response.status.should == 302

      template_name = Carto::NamedMaps::Template.new(Carto::Visualization.find(@table1.table_visualization.id)).name
      last_response.location.should == "http://#{@user_1.username}.localhost.lan:8181/api/v1/map/static/named/#{template_name}/#{width}/#{height}.png"

      get api_v2_visualizations_static_map_url(
        user_domain: @user_1.username,
        id: private_table.table_visualization.id,
        width: width,
        height: height
      ), @headers
      last_response.status.should == 403

      get api_v2_visualizations_static_map_url(
        user_domain: @user_1.username,
        api_key: @user_1.api_key,
        id: private_table.table_visualization.id,
        width: width,
        height: height
      ), @headers
      last_response.status.should == 302

      visualization_id = private_table.table_visualization.id

      template_name = Carto::NamedMaps::Template.new(Carto::Visualization.find(visualization_id)).name
      last_response.location.should == "http://#{@user_1.username}.localhost.lan:8181/api/v1/map/static/named/#{template_name}/#{width}/#{height}.png"
    end

    it 'tests varnish keys' do
      width = 123
      height = 456

      Carto::StaticMapsURLHelper.any_instance
                                .stubs(:get_cdn_config)
                                .returns("http" => "cdn.local.lan")

      get api_v2_visualizations_static_map_url(
        user_domain: @user_1.username,
        # api_key: @user_1.api_key,
        id: @table1.table_visualization.id,
        width: width,
        height: height
      ), @headers
      last_response.status.should == 302
      last_response.headers["X-Cache-Channel"].should include(@table1.name)
      last_response.headers["X-Cache-Channel"].should include(@table1.table_visualization.varnish_key)
      last_response.headers["Surrogate-Key"].should_not be_empty
      last_response.headers["Surrogate-Key"].should include(CartoDB::SURROGATE_NAMESPACE_VIZJSON)
      last_response.headers["Surrogate-Key"].should include(@table1.table_visualization.surrogate_key)
    end

  end

  describe 'index' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:all) do
      Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)

      @user_1 = FactoryGirl.create(:valid_user)
    end

    before(:each) do
      login(@user_1)
      @headers = { 'CONTENT_TYPE' => 'application/json' }
      host! "#{@user_1.subdomain}.localhost.lan"
    end

    after(:each) do
      delete_user_data @user_1
    end

    after(:all) do
      @user_1.destroy
    end

    it 'returns success, empty response for empty user' do
      response_body.should == { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns valid information for a user with one table' do
      table1 = create_random_table(@user_1)
      table1_visualization = CartoDB::Visualization::Member.new(id: table1.table_visualization.id).fetch
      table1_visualization_hash = table1_visualization.to_hash(
        related: false,
        table_data: true,
        user: @user_1,
        table: table1,
        synchronization: nil)
      table1_visualization_hash[:permission][:owner].delete(:groups)
      table1_visualization_hash[:table][:permission][:owner].delete(:groups)
      expected_visualization = JSON.parse(table1_visualization_hash.to_json)
      expected_visualization = normalize_hash(expected_visualization)

      # This is only in the Carto::Visualization presenter (not in old member presenter)
      expected_visualization['uses_builder_features'] = false
      expected_visualization['auth_tokens'] = nil # normalize_hash converts [] to nil
      expected_visualization['version'] = 2

      response = response_body(type: CartoDB::Visualization::Member::TYPE_CANONICAL)
      # INFO: old API won't support server side generated urls for visualizations. See #5250 and #5279
      response['visualizations'][0].delete('url')
      response['visualizations'][0]['synchronization'] = {}
      response.should == {
        'visualizations' => [expected_visualization],
        'total_entries' => 1,
        'total_user_entries' => 1,
        'total_likes' => 0,
        'total_shared' => 0
      }
    end

    it 'returns liked count' do
      vis = FactoryGirl.build(:derived_visualization, user_id: @user_1.id).store
      vis.add_like_from(@user_1.id)

      response_body(type: CartoDB::Visualization::Member::TYPE_DERIVED)['total_likes'].should == 1
    end

    it 'does a partial match search' do
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'foo').store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'bar').store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'foo_patata_bar').store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'foo_patata_baz').store

      body = response_body(q: 'patata', type: CartoDB::Visualization::Member::TYPE_DERIVED)
      body['total_entries'].should == 2
      body['total_user_entries'].should == 4
    end

    describe 'performance with many tables' do
      # The bigger the number the better the improvement, but test gets too slow
      VIZS_N = 20

      before(:all) do
        @visualizations = (1..VIZS_N).map { FactoryGirl.create(:carto_user_table_with_canonical, user_id: @user_1.id) }
      end

      LIST_NAMES_PARAMS = {
        type: CartoDB::Visualization::Member::TYPE_CANONICAL,
        order: :updated_at,
        page: 1,
        per_page: 3000,
        exclude_shared: false,
        exclude_raster: true
      }.freeze

      NO_FETCHING_PARAMS = {
        show_likes: false,
        show_liked: false,
        show_stats: false,
        show_table: false,
        show_permission: false,
        show_synchronization: false,
        show_uses_builder_features: false,
        show_auth_tokens: false,
        load_totals: false
      }.freeze

      it 'should improve with reduced fetching (see #12058)' do
        no_fetching_params = LIST_NAMES_PARAMS.merge(NO_FETCHING_PARAMS)

        beginning = Time.now
        get base_url, LIST_NAMES_PARAMS.dup, @headers
        body1 = last_response.body
        full_time = Time.now

        get base_url, no_fetching_params.dup, @headers
        body2 = last_response.body
        no_fetch_time = Time.now

        ((full_time - beginning) / (no_fetch_time - full_time)).should be >= 3

        body1 = JSON.parse(body1)
        body1['visualizations'].count.should eq VIZS_N
        body1['total_entries'].should eq VIZS_N
        body1['total_shared'].should_not be_nil
        body2 = JSON.parse(body2)
        body2['visualizations'].count.should eq VIZS_N
        body2['total_entries'].should eq VIZS_N
        body2['total_shared'].should be_nil
      end
    end

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
      @feature_flag.destroy
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
        @user_domain = @carto_user1.username
        @user_domain2 = @carto_user2.username
      end

      after(:each) do
        destroy_full_visualization(@map, @table, @table_visualization, @map_visualization)
      end

      describe 'GET likes_count' do
        it 'returns the number of likes for a given visualization' do
          get api_v1_visualizations_likes_count_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes').to_i).to eq(0)

          @vis.add_like_from(@carto_user1.id)

          get api_v1_visualizations_likes_count_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes').to_i).to eq(1)
        end
      end

      describe 'GET likes_list' do
        it 'returns the likes for a given visualization' do
          get api_v1_visualizations_likes_list_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes')).to eq([])

          @vis.add_like_from(@carto_user1.id)

          get api_v1_visualizations_likes_list_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes')).to eq([{'actor_id' => @user_1.id}])

          @vis.add_like_from(@carto_user2.id)
          @vis.remove_like_from(@carto_user1.id)

          get api_v1_visualizations_likes_list_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes')).to eq([{'actor_id' => @carto_user2.id}])
        end
      end

      describe 'GET is_liked' do
        it 'return true when a given user liked a visualization, false otherwise' do
          @vis.add_like_from(@user_1.id)

          get api_v1_visualizations_is_liked_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('liked')).to be_true

          get api_v1_visualizations_is_liked_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user2.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('liked')).to be_false
        end
      end

      describe 'POST add_like' do
        it 'triggers error 403 if not authenticated' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: 'foo')
          expect(last_response.status).to eq(403)
        end

        it 'add likes to a given visualization' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)

          post api_v1_visualizations_add_like_url(user_domain: @user_domain2, id: @vis.id, api_key: @carto_user2.api_key)

          expect(last_response.status).to eq(200)
        end

        it 'returns an error if you try to like twice a visualization' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)

          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(400)
          expect(last_response.body).to eq("You've already liked this visualization")
        end

        it 'sends an email to the owner when a map is liked' do
          vis = @map_visualization

          Resque.expects(:enqueue)
                .with(::Resque::UserJobs::Mail::MapLiked, vis.id, @carto_user2.id, kind_of(String))
                .returns(true)

          post api_v1_visualizations_add_like_url(user_domain: @user_domain2, id: vis.id, api_key: @carto_user2.api_key)

          expect(last_response.status).to eq(200)
        end

        it 'does not send an email when a map is liked by the owner' do
          vis = @map_visualization

          Resque.expects(:enqueue)
                .with(::Resque::UserJobs::Mail::MapLiked, vis.id, @carto_user2.id, kind_of(String))
                .never

          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
        end

        it 'sends an email to the owner when a dataset is liked' do
          vis = @table_visualization

          post api_v1_visualizations_add_like_url(user_domain: @user_domain2, id: vis.id, api_key: @carto_user2.api_key)

          expect(last_response.status).to eq(200)
        end

        it 'does not send an email when when a dataset is liked by the owner' do
          vis = @table_visualization

          Resque.expects(:enqueue)
                .with(::Resque::UserJobs::Mail::TableLiked, vis.id, @carto_user1.id, kind_of(String))
                .never

          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
        end
      end

      describe 'POST remove_like' do
        it 'triggers error 403 if not authenticated' do
          post api_v1_visualizations_add_like_url(user_domain: @user_domain, id: @vis.id, api_key: 'foo')
          expect(last_response.status).to eq(403)
        end

        it 'removes a like from a given visualization and returns the number of likes' do
          @vis.add_like_from(@carto_user1.id)
          @vis.add_like_from(@carto_user2.id)

          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes').to_i).to eq(1)

          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain2, id: @vis.id, api_key: @carto_user2.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes').to_i).to eq(0)
        end

        it 'does not returns error if you try to remove a non-existent like' do
          delete api_v1_visualizations_remove_like_url(user_domain: @user_domain, id: @vis.id, api_key: @carto_user1.api_key)

          expect(last_response.status).to eq(200)
          expect(JSON.parse(last_response.body).fetch('likes').to_i).to eq(0)
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
        body['visualizations'][0]['table']['name'].should == "\"#{@org_user_2.database_schema}\".#{u2_t_2.name}"

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
          show_likes: true
        )

        get url, {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)

        response['likes'].should eq 0
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
          related_canonical[0]['id'].should eq @table_visualization.id
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
                   show_likes: true,
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
                response.body[:likes].should eq 0
                response.body[:stats].should be_empty
                response.body[:auth_tokens].should be_empty
                response.body[:permission].should eq nil
              end
            end

            it 'only returns public information, including optional if requested' do
              url = api_v1_visualizations_show_url(
                id: @visualization.id,
                show_liked: true,
                show_likes: true,
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
                response.body[:likes].should eq 0
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
                related_canonical[0]['id'].should eq @table_visualization.id
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
                         show_likes: true,
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
        index = response.body[:layers].index { |l| l['options'] && l['options']['layer_definition'] }
        response.body[:layers][index]['options']['layer_definition']
      end

      def first_layer_named_map_from_response(response)
        index = response.body[:layers].index { |l| l['options'] && l['options']['named_map'] }
        response.body[:layers][index]['options']['named_map']
      end

      def first_data_layer_from_response(response)
        index = response.body[:layers].index { |l| l['type'] == 'CartoDB' }
        response.body[:layers][index]
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

          it 'uses v3 infowindows and tooltips templates removing "table/views/" from template_name' do
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

              layer = first_data_layer_from_response(response)
              response_infowindow = layer['infowindow']
              infowindow['template_name'].should eq "table/views/infowindow_light"
              response_infowindow['template_name'].should eq "infowindow_light"
              response_infowindow['template'].should include(v3_infowindow_light_template_fragment)
              response_infowindow['template'].should_not include(v2_infowindow_light_template_fragment)

              response_tooltip = layer['tooltip']
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

              layer = first_data_layer_from_response(response)
              response_infowindow = layer['infowindow']
              infowindow['template_name'].should eq "table/views/infowindow_light"
              response_infowindow['template_name'].should eq 'infowindow_light'
              response_infowindow['template'].should include(v3_infowindow_light_template_fragment)
              response_infowindow['template'].should_not include(v2_infowindow_light_template_fragment)

              response_tooltip = layer['tooltip']
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

              layer = first_data_layer_from_response(response)
              response_infowindow = layer['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
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
              response_infowindow = layer_named_map['layers'][0]['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer_named_map['layers'][0]['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
            end

            get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
              response.status.should eq 200

              layer = first_data_layer_from_response(response)
              response_infowindow = layer['infowindow']
              response_infowindow['template_name'].should eq ''
              response_infowindow['template'].should eq custom_infowindow[:template]

              response_tooltip = layer['tooltip']
              response_tooltip['template_name'].should eq ''
              response_tooltip['template'].should eq custom_tooltip[:template]
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
          vizjson3[:datasource].has_key?('template_name').should be_false
        end
      end
    end

    describe 'tests visualization listing filters' do
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

    it 'orders remotes by size with external sources size' do
      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', display_name: 'visu1').to_json, @headers
      vis_1_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_1_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1,
        size: 100).save

      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', display_name: 'visu2').to_json, @headers
      vis_2_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_2_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1,
        size: 200).save

      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', display_name: 'visu3').to_json, @headers
      vis_3_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_3_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1, size: 10).save

      get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'remote', order: 'size'), {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 3
      collection[0]['id'].should == vis_2_id
      collection[1]['id'].should == vis_1_id
      collection[2]['id'].should == vis_3_id
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

    it 'validates order param' do
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
        response.body[:visualizations][0]['id'].should_not be_empty
        response.body[:visualizations][0]['auth_tokens'].should_not be_empty
      end

      get_json api_v1_visualizations_index_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key,
                                               type: Carto::Visualization::TYPE_DERIVED,
                                               shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers do |response|
        response.status.should eq 200
        response.body[:visualizations][0]['id'].should_not be_empty
        response.body[:visualizations][0]['auth_tokens'].should be_empty
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
  end

  describe 'filter canonical viz by bounding box' do
    include_context 'visualization creation helpers'

    before(:all) do
      bypass_named_maps
      @user = FactoryGirl.create(:valid_user)

      @table_inside_bbox = create_geometry_table(@user, BBOX_GEOM)
      @table_outside_bbox = create_geometry_table(@user, OUTSIDE_BBOX_GEOM)
    end

    after(:all) do
      @user.destroy
    end

    it 'should show return only visualizations that intersect with the bbox' do
      get api_v1_visualizations_index_url(user_domain: @user.username,
          types: CartoDB::Visualization::Member::TYPE_CANONICAL, bbox: '-18.166667,27.633333,4.333333,43.916667'), @headers
      body = JSON.parse(last_response.body)
      body["visualizations"].length.should eq 1
      body["visualizations"][0]["id"].should eq @table_inside_bbox.table_visualization.id
    end

    it 'should return 400 when try to filter by bbox and not canonical visualizations' do
      get api_v1_visualizations_index_url(user_domain: @user.username,
          types: CartoDB::Visualization::Member::TYPE_DERIVED, bbox: '-18.166667,27.633333,4.333333,43.916667'), @headers
      last_response.status.should eq 400
    end

    it 'should return 400 when try to filter by bbox and with more than only canonical visualizations' do
      get api_v1_visualizations_index_url(user_domain: @user.username,
          types: "#{CartoDB::Visualization::Member::TYPE_DERIVED}, #{CartoDB::Visualization::Member::TYPE_CANONICAL}", bbox: '-18.166667,27.633333,4.333333,43.916667'), @headers
      last_response.status.should eq 400
    end

    it 'should return 400 when try to filter by bbox with less than 4 coordinates' do
      get api_v1_visualizations_index_url(user_domain: @user.username,
          types: CartoDB::Visualization::Member::TYPE_DERIVED, bbox: '27.633333,4.333333,43.916667'), @headers
      last_response.status.should eq 400
    end

    it 'should return 400 when try to filter by bbox with wrong typed coordinates' do
      get api_v1_visualizations_index_url(user_domain: @user.username,
          types: CartoDB::Visualization::Member::TYPE_CANONICAL, bbox: '18.323232,alal,4.333333,43.916667'), @headers
      last_response.status.should eq 400
      get api_v1_visualizations_index_url(user_domain: @user.username,
          types: CartoDB::Visualization::Member::TYPE_CANONICAL, bbox: 'true,2.393939,4.333333,43.916667'), @headers
      last_response.status.should eq 400
    end

  end

  # See #5591
  describe 'error with wrong visualization url' do
    def url(user_domain, visualization_id, api_key, host = @host)
      api_v1_visualizations_show_url(user_domain: user_domain, id: visualization_id, api_key: api_key).
        gsub('www.example.com', host)
    end

    describe 'normal user urls' do
      before(:all) do
        bypass_named_maps
        @vis_owner = FactoryGirl.create(:valid_user, private_tables_enabled: true)
        @other_user = FactoryGirl.create(:valid_user, private_tables_enabled: true)

        @table = create_random_table(@vis_owner, unique_name('viz'), UserTable::PRIVACY_PRIVATE)
        @vis = @table.table_visualization
        @vis.private?.should == true

        @host = "#{@vis_owner.username}.localhost.lan"

        @headers = http_json_headers
      end

      after(:all) do
        @table.destroy
      end

      it 'returns 200 with owner user_domain' do
        get_json url(@vis_owner.username, @vis.id, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 200
        end
      end

      it 'returns 404 if visualization does not exist' do
        get_json url(@vis_owner.username, random_uuid, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization does not exist'
        end
      end

      it 'returns 403 under other user domain if visualization is private' do
        get_json url(@other_user.username, @vis.id, @other_user.api_key), {}, @headers do |response|
          response.status.should == 403
          response.body[:errors].should == 'Visualization not viewable'
        end
      end

      it 'returns 403 if visualization is private' do
        get_json url(@vis_owner.username, @vis.id, @other_user.api_key), {}, @headers do |response|
          response.status.should == 403
        end
      end

      it 'returns 200 if user at url is empty' do
        ApplicationController.any_instance.stubs(:current_viewer).returns(@vis_owner)
        login_as(@vis_owner, scope: @vis_owner.username)
        get_json url(nil, @vis.id, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 200
        end
      end

      it 'returns 404 if user at url does not match visualization owner' do
        app = ApplicationController.any_instance
        app.stubs(:current_user).returns(@vis_owner)
        app.stubs(:current_viewer).returns(@vis_owner)
        app.stubs(:api_authorization_required).returns(true)

        get_json url(@other_user.username, @vis.id, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 404
        end
      end

      it 'returns 404 if user subdomain does not match visualization owner' do
        app = ApplicationController.any_instance
        app.stubs(:current_user).returns(@vis_owner)
        app.stubs(:current_viewer).returns(@vis_owner)
        app.stubs(:api_authorization_required).returns(true)

        host = "#{@other_user.username}.localhost.lan"
        get_json url(nil, @vis.id, @vis_owner.api_key, host), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization of that user does not exist'
        end
      end
    end

    describe 'organization urls' do
      include_context 'organization with users helper'

      before(:each) do
        bypass_named_maps

        @vis_owner = @org_user_1
        @shared_vis = FactoryGirl.build(:derived_visualization,
                                        user_id: @vis_owner.id,
                                        name: unique_name('viz'),
                                        description: 'wadus desc',
                                        privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE).store
        @shared_user = @org_user_2
        @not_shared_user = @org_user_owner
        share_visualization(@shared_vis, @shared_user)

        @host = "#{@vis_owner.organization.name}.localhost.lan"

        @headers = http_json_headers
      end

      after(:each) do
        @shared_vis.delete
      end

      it 'returns 200 with owner user_domain' do
        get_json url(@vis_owner.username, @shared_vis.id, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 200
        end
      end

      it 'returns 200 with valid (shared user) user_domain' do
        get_json url(@shared_user.username, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 200
        end
      end

      it 'returns 200 with valid shared user (current_user) user_domain, with current_viewer being the owner' do
        ApplicationController.any_instance.stubs(:current_viewer).returns(@vis_owner)
        ApplicationController.any_instance.stubs(:current_user).returns(@shared_user)
        get_json url(@shared_user.username, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 200
        end
      end

      it 'returns 200 and private info with valid shared user user_domain' do
        get_json url(@shared_user.username, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 200
          response.body[:description].should_not be_nil
          response.body[:auth_tokens].should_not be_nil
        end
      end

      it 'returns 404 if visualization does not exist' do
        get_json url(@vis_owner.username, random_uuid, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization does not exist'
        end
      end

      it 'returns 403 if visualization is not shared with the domain user' do
        get_json url(@not_shared_user.username, @shared_vis.id, @not_shared_user.api_key), {}, @headers do |response|
          response.status.should == 403
          response.body[:errors].should == 'Visualization not viewable'
        end
      end

      it 'returns 403 if visualization is not shared with the apikey user' do
        get_json url(@shared_user.username, @shared_vis.id, @not_shared_user.api_key), {}, @headers do |response|
          response.status.should == 403
        end
      end

      it 'returns 404 if user at url is empty' do
        ApplicationController.any_instance.stubs(:current_viewer).returns(@shared_user)
        login_as(@shared_user, scope: @shared_user.organization.name)
        get_json url(nil, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization of that user does not exist'
        end
      end

      it 'returns 404 if user at url is empty, current_user is the owner and current_viewer has permission' do
        ApplicationController.any_instance.stubs(:current_user).returns(@vis_owner)
        ApplicationController.any_instance.stubs(:current_viewer).returns(@shared_user)
        login_as(@shared_user, scope: @shared_user.organization.name)
        get_json url(nil, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization of that user does not exist'
        end
      end

      it 'returns 404 if user at url does not match visualization owner' do
        app = ApplicationController.any_instance
        app.stubs(:current_user).returns(@shared_user)
        app.stubs(:current_viewer).returns(@shared_user)
        app.stubs(:api_authorization_required).returns(true)

        login_as(@shared_user, scope: @shared_user.organization.name)
        get_json url(@not_shared_user.username, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization of that user does not exist'
        end
      end

      it 'returns 404 if user at url does not match visualization owner with current_user being the owner and current_viewer the shared to' do
        app = ApplicationController.any_instance
        app.stubs(:current_user).returns(@vis_owner)
        app.stubs(:current_viewer).returns(@shared_user)
        app.stubs(:api_authorization_required).returns(true)

        login_as(@shared_user, scope: @shared_user.organization.name)
        get_json url(@not_shared_user.username, @shared_vis.id, @shared_user.api_key), {}, @headers do |response|
          response.status.should == 404
          response.body[:errors].should == 'Visualization of that user does not exist'
        end
      end
    end
  end

  describe '#google_maps_static_image' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      base_layer = @visualization.base_layers.first
      base_layer.options[:baseType] = 'roadmap'
      base_layer.options[:style] = '[]'
      base_layer.save
    end

    before(:each) do
      host! "#{@user.username}.localhost.lan"
      login_as(@user, scope: @user.username)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      @user.destroy
    end

    let(:params) do
      {
        size: '300x200',
        zoom: 14,
        center: '0.12,-7.56'
      }
    end

    it 'returns error if user does not have Google configured' do
      @user.google_maps_key = nil
      @user.save
      get_json api_v1_google_maps_static_image_url(params.merge(id: @visualization.id)) do |response|
        expect(response.status).to eq 400
        expect(response.body[:errors]).to be
      end
    end

    it 'returns signed google maps URL (key)' do
      @user.google_maps_key = 'key=GAdhfasjkd'
      @user.save
      get_json api_v1_google_maps_static_image_url(params.merge(id: @visualization.id)) do |response|
        response.status.should be_success
        response.body[:url].should eq 'https://maps.googleapis.com/maps/api/staticmap?center=0.12,-7.56&mapType=roadmap&size=300x200&zoom=14&key=GAdhfasjkd'
      end
    end

    it 'returns signed google maps URL (client + signature)' do
      @user.google_maps_key = 'client=GAdhfasjkd'
      @user.google_maps_private_key = 'MjM0MzJk-3N_czQzJmFkc2Rhc2Q='
      @user.save
      get_json api_v1_google_maps_static_image_url(params.merge(id: @visualization.id)) do |response|
        response.status.should be_success
        response.body[:url].should eq 'https://maps.googleapis.com/maps/api/staticmap?center=0.12,-7.56&mapType=roadmap&size=300x200&zoom=14&client=GAdhfasjkd&signature=q3E0WXgV1XlglotqoRXUZ4O8d10='
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

  def response_body(params = nil)
    get base_url, params.nil? ? nil : params.dup, @headers
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
    organization.builder_enabled = false
    organization
  end

  def create_geometry_table(user, the_geom)
    table = new_table(privacy: UserTable::PRIVACY_PUBLIC, user_id: user.id)
    table.force_schema = "the_geom geometry"
    table.the_geom_type = "point"
    table.save.reload
    table.insert_row!(the_geom: the_geom)
    table.update_bounding_box
    table
  end

end
