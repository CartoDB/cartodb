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

  describe 'filter canonical viz by bounding box' do
    include_context 'visualization creation helpers'

    before(:all) do
      bypass_named_maps
      @user = create(:valid_user)

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
        @vis_owner = create(:valid_user, private_tables_enabled: true)
        @other_user = create(:valid_user, private_tables_enabled: true)

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
        @shared_vis = build(:derived_visualization,
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
      @user = create(:carto_user)
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
end
