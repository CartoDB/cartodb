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

  before(:all) do
    create_account_type_fg('ORGANIZATION USER')
  end

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

    def compare_with_dates(a, b)
      # Compares two hashes, ignoring differences in timezones
      a.keys.sort.should eq b.keys.sort
      a.each do |k, v|
        v2 = b[k]
        if k.ends_with?('_at')
          # DateTime.parse(v).should eq DateTime.parse(v2) unless v.blank? && v2.blank?
        elsif v.is_a?(Hash)
          compare_with_dates(v, v2)
        else
          v.should eq v2
        end
      end
    end

    it 'raises param invalid error if user does not exist' do
      host! "pra.localhost.lan"
      get base_url, {  }, @headers
      JSON.load(last_response.body)['error'].should eq "Wrong 'username' parameter value."
      last_response.status.should eq 400
    end

    it 'returns success, empty response for empty user' do
      expected_response = {
        'visualizations' => [],
        'total_entries' => 0,
        'total_likes' => 0,
        'total_user_entries' => 0,
        'total_shared' => 0,
        'total_locked' => 0
      }
      response_body.should == expected_response
    end

    it 'returns 400 if wrong page parameter is passed' do
      get base_url, { page: '%00' }, @headers
      last_response.status.should == 400
    end

    it 'returns 400 if wrong per_page parameter is passed' do
      get base_url, { per_page: '%00' }, @headers
      last_response.status.should == 400
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
      compare_with_dates(response['visualizations'][0], expected_visualization)
      response['total_entries'].should eq 1
      response['total_user_entries'].should eq 1
      response['total_shared'].should eq 0
      response['total_locked'].should eq 0
    end

    it 'returns locked count' do
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, locked: false).store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, locked: true).store
      user2 = FactoryGirl.create(:valid_user)
      FactoryGirl.build(:derived_visualization, user_id: user2.id, locked: true).store

      response_body(type: CartoDB::Visualization::Member::TYPE_DERIVED)['total_locked'].should == 1
    end

    it 'does a partial match search' do
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'foo').store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'bar').store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'foo_patata_bar').store
      FactoryGirl.build(:derived_visualization, user_id: @user_1.id, name: 'foo_patata_baz').store

      body = response_body(q: 'patata', type: CartoDB::Visualization::Member::TYPE_DERIVED)
      body['total_entries'].should == 2
      body['total_user_entries'].should == 4

      body = response_body(q: '_atata', type: CartoDB::Visualization::Member::TYPE_DERIVED)
      body['total_entries'].should == 0
      body['total_user_entries'].should == 4
    end

    it 'allows to search datasets including dependent visualizations' do
      FactoryGirl.create(:table_visualization, user_id: @user_1.id, name: 'foo')

      body = response_body(q: 'foo', type: CartoDB::Visualization::Member::TYPE_CANONICAL,
                           with_dependent_visualizations: 10)

      body['total_entries'].should == 1
      body['total_user_entries'].should == 1
      body['visualizations'][0]['dependent_visualizations_count'].should be_zero
    end

    it 'exludes any kind of permissions with show_permission=false' do
      FactoryGirl.create(:carto_user_table_with_canonical, user_id: @user_1.id)

      body = response_body(type: CartoDB::Visualization::Member::TYPE_CANONICAL, show_permission: false)

      body['total_entries'].should == 1
      body['visualizations'][0]['permission'].should be_nil
      body['visualizations'][0]['table']['permission'].should be_nil
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
