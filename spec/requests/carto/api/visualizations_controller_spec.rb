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

  describe 'vizjson2 generator' do
    it_behaves_like 'vizjson generator' do
      def api_vx_visualizations_vizjson_url(options)
        api_v2_visualizations_vizjson_url(options)
      end
    end
  end

  describe 'vizjson3 generator' do
    it_behaves_like 'vizjson generator' do
      def api_vx_visualizations_vizjson_url(options)
        api_v3_visualizations_vizjson_url(options)
      end
    end
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

  describe 'static_map' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      @user_1 = FactoryGirl.create(:valid_user, private_tables_enabled: false)
      @user_2 = FactoryGirl.create(:valid_user)

      @headers = {'CONTENT_TYPE'  => 'application/json'}
      host! "#{@user_1.subdomain}.localhost.lan"
    end

    after(:each) do
      @user_1.destroy
      @user_2.destroy
    end

    it 'tests with non-existing cdn config, which uses maps_api_template url' do
      width = 123
      height = 456

      table1 = create_random_table(@user_1)

      Carto::StaticMapsURLHelper.any_instance
                                .stubs(:get_cdn_config)
                                .returns(nil)
      ApplicationHelper.stubs(:maps_api_template)
                       .returns("http://#{@user_1.username}.localhost.lan:8181")

      get api_v2_visualizations_static_map_url({
          user_domain: @user_1.username,
          id: table1.table_visualization.id,
          width: width,
          height: height
        }),
        @headers
      last_response.status.should == 302

      tpl_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(table1.table_visualization.id)
      last_response.location.should == "http://#{@user_1.username}.localhost.lan:8181/api/v1/map/static/named/#{tpl_id}/#{width}/#{height}.png"
    end

    it 'tests with existing cdn config' do
      width = 123
      height = 456

      table1 = create_random_table(@user_1)

      Carto::StaticMapsURLHelper.any_instance
                                .stubs(:get_cdn_config)
                                .returns("http" => "cdn.local.lan")

      get api_v2_visualizations_static_map_url(
          user_domain: @user_1.username,
          id: table1.table_visualization.id,
          width: width,
          height: height
        ),
        @headers
      last_response.status.should == 302

      tpl_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(table1.table_visualization.id)
      last_response.location.should == "http://cdn.local.lan/#{@user_1.username}/api/v1/map/static/named/#{tpl_id}/#{width}/#{height}.png"
    end

    it 'tests privacy of static_maps calls' do
      # As privacy is equal to other visualizations controller methods, no need to test every option, just generally

      width = 123
      height = 456

      public_table = create_random_table(@user_1)

      # By default no private tables so all are created public
      @user_1.private_tables_enabled = true
      @user_1.save

      private_table = create_random_table(@user_1)

      Carto::StaticMapsURLHelper.any_instance
                                     .stubs(:get_cdn_config)
                                     .returns(nil)
      ApplicationHelper.stubs(:maps_api_template)
                       .returns("http://#{@user_1.username}.localhost.lan:8181")

      get api_v2_visualizations_static_map_url({
          user_domain: @user_1.username,
          id: public_table.table_visualization.id,
          width: width,
          height: height
        }),
        @headers
      last_response.status.should == 302
      tpl_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(public_table.table_visualization.id)
      last_response.location.should == "http://#{@user_1.username}.localhost.lan:8181/api/v1/map/static/named/#{tpl_id}/#{width}/#{height}.png"

      get api_v2_visualizations_static_map_url({
          user_domain: @user_1.username,
          id: private_table.table_visualization.id,
          width: width,
          height: height
        }),
        @headers
      last_response.status.should == 403

      get api_v2_visualizations_static_map_url({
          user_domain: @user_1.username,
          api_key: @user_1.api_key,
          id: private_table.table_visualization.id,
          width: width,
          height: height
        }),
        @headers
      last_response.status.should == 302
      tpl_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(private_table.table_visualization.id)
      last_response.location.should == "http://#{@user_1.username}.localhost.lan:8181/api/v1/map/static/named/#{tpl_id}/#{width}/#{height}.png"
    end

    it 'tests varnish keys' do
      width = 123
      height = 456

      table1 = create_random_table(@user_1)

      Carto::StaticMapsURLHelper.any_instance
                                     .stubs(:get_cdn_config)
                                     .returns("http" => "cdn.local.lan")

      get api_v2_visualizations_static_map_url({
          user_domain: @user_1.username,
          #api_key: @user_1.api_key,
          id: table1.table_visualization.id,
          width: width,
          height: height
        }),
        @headers
      last_response.status.should == 302
      last_response.headers["X-Cache-Channel"].should include(table1.name)
      last_response.headers["X-Cache-Channel"].should include(table1.table_visualization.varnish_key)
      last_response.headers["Surrogate-Key"].should_not be_empty
      last_response.headers["Surrogate-Key"].should include(CartoDB::SURROGATE_NAMESPACE_VIZJSON)
      last_response.headers["Surrogate-Key"].should include(table1.table_visualization.surrogate_key)
    end

  end

  describe 'index' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true)

      @user_1 = FactoryGirl.create(:valid_user)
      @user_2 = FactoryGirl.create(:valid_user)

      login(@user_1)

      @headers = {'CONTENT_TYPE'  => 'application/json'}
      host! "#{@user_1.subdomain}.localhost.lan"
      delete_user_data @user_1
    end

    after(:each) do
      @user_1.destroy
      @user_2.destroy
    end

    it 'returns success, empty response for empty user' do
      response_body.should == { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns valid information for a user with one table' do
      table1 = create_random_table(@user_1)
      table1_visualization_hash = table1.table_visualization.to_hash(
        related: false,
        table_data: true,
        user: @user_1,
        table: table1,
        synchronization: nil)
      table1_visualization_hash[:permission][:owner].delete(:groups)
      table1_visualization_hash[:table][:permission][:owner].delete(:groups)
      expected_visualization = JSON.parse(table1_visualization_hash.to_json)
      expected_visualization = normalize_hash(expected_visualization)

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
      table1 = create_random_table(@user_1)
      table1b = create_random_table(@user_1)
      table2 = create_random_table(@user_2)
      table2b = create_random_table(@user_2)
      visualization2 = table2.table_visualization
      visualization2.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization2.store
      visualization2.add_like_from(@user_1.id)

      response_body(type: CartoDB::Visualization::Member::TYPE_CANONICAL)['total_likes'].should == 1
    end

    it 'does a partial match search' do
      create_random_table(@user_1, "foo")
      create_random_table(@user_1, "bar")
      create_random_table(@user_1, "foo_patata_bar")
      create_random_table(@user_1, "foo_patata_baz")

      body = response_body(q: 'patata', type: CartoDB::Visualization::Member::TYPE_CANONICAL)
      body['total_entries'].should == 2
      body['total_user_entries'].should == 4
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

  end

  describe 'index shared_only' do
    include_context 'organization with users helper'
    include_context 'visualization creation helpers'

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

  describe 'visualization url generation' do
    include_context 'visualization creation helpers'
    include_context 'users helper'
    include_context 'organization with users helper'

    before(:each) do
      @user = FactoryGirl.create(:valid_user)
    end

    after(:each) do
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

    before(:each) do
      @user = FactoryGirl.create(:valid_user)

      @table_inside_bbox = create_geometry_table(@user, BBOX_GEOM)
      @table_outside_bbox = create_geometry_table(@user, OUTSIDE_BBOX_GEOM)
    end

    after(:each) do
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
      include_context 'users helper'

      before(:each) do
        stub_named_maps_calls

        @vis_owner = @user1
        @vis_owner.private_tables_enabled = true
        @vis_owner.save
        @other_user = @user2
        @table = create_random_table(@vis_owner, unique_name('viz'), UserTable::PRIVACY_PRIVATE)
        @vis = @table.table_visualization
        @vis.private?.should == true

        @host = "#{@vis_owner.username}.localhost.lan"

        @headers = http_json_headers
      end

      after(:each) do
        @table.destroy
      end

      it 'returns 200 with owner user_domain' do
        get_json url(@vis_owner.username, @vis.id, @vis_owner.api_key), {}, @headers do |response|
          response.status.should == 200
        end
      end

      it 'returns 404 if visualization does not exist' do
        random_uuid = UUIDTools::UUID.timestamp_create.to_s
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

      it 'returns 401 if visualization is private' do
        get_json url(@vis_owner.username, @vis.id, @other_user.api_key), {}, @headers do |response|
          response.status.should == 401
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
        stub_named_maps_calls

        @vis_owner = @org_user_1
        @table = create_random_table(@vis_owner, unique_name('viz'), UserTable::PRIVACY_PRIVATE)
        @shared_vis = @table.table_visualization
        @shared_user = @org_user_2
        @not_shared_user = @org_user_owner
        share_visualization(@shared_vis, @shared_user)

        @host = "#{@vis_owner.organization.name}.localhost.lan"

        @headers = http_json_headers
      end

      after(:each) do
        @table.destroy
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

      it 'returns 404 if visualization does not exist' do
        random_uuid = UUIDTools::UUID.timestamp_create.to_s
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

      it 'returns 401 if visualization is not shared with the apikey user' do
        get_json url(@shared_user.username, @shared_vis.id, @not_shared_user.api_key), {}, @headers do |response|
          response.status.should == 401
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
