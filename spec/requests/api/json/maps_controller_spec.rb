# encoding: utf-8

require_relative '../../../spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/api/json/maps_controller'
require_relative 'maps_controller_shared_examples'

describe Api::Json::MapsController do
  it_behaves_like 'maps controllers' do
  end

  include Carto::Factories::Visualizations
  include HelperMethods

  def bypass_named_maps
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true, delete: true)
  end

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @user2 = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
  end

  before(:each) do
    bypass_named_maps
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    # This avoids connection leaking.
    ::User[@user.id].destroy
    ::User[@user2.id].destroy
    bypass_named_maps
  end

  describe '#update' do
    it 'updates existing map by id' do
      # Intentionally uses long decimal numbers to test against JSON serialization problems
      payload = {
        provider: 'not_leaflet',
        bounding_box_sw: [5.123456789123456789, 5.123456789123456789],
        bounding_box_ne: [10.123456789123456789, 20.123456789123456789],
        center: [7.123456789123456789, 7.123456789123456789],
        zoom: 42,
        view_bounds_sw: [-15.123456789123456789, -15.123456789123456789],
        view_bounds_ne: [-35.123456789123456789, -55.123456789123456789],
        legends: false,
        scrollwheel: true
      }

      put_json api_v1_maps_update_url(user_domain: @user.username, api_key: @user.api_key, id: @map.id), payload do |response|
        response.status.should be_success
        response.body[:provider].should eq payload[:provider]
        JSON.parse(response.body[:bounding_box_sw]).should eq payload[:bounding_box_sw]
        JSON.parse(response.body[:bounding_box_ne]).should eq payload[:bounding_box_ne]
        JSON.parse(response.body[:center]).should eq payload[:center]
        response.body[:zoom].should eq payload[:zoom]
        JSON.parse(response.body[:view_bounds_sw]).should eq payload[:view_bounds_sw]
        JSON.parse(response.body[:view_bounds_ne]).should eq payload[:view_bounds_ne]
        response.body[:legends].should eq payload[:legends]
        response.body[:scrollwheel].should eq payload[:scrollwheel]
      end

      @map.reload
      @map.provider.should eq payload[:provider]
      JSON.parse(@map.bounding_box_sw).should eq payload[:bounding_box_sw]
      JSON.parse(@map.bounding_box_ne).should eq payload[:bounding_box_ne]
      JSON.parse(@map.center).should eq payload[:center]
      @map.zoom.should eq payload[:zoom]
      JSON.parse(@map.view_bounds_sw).should eq payload[:view_bounds_sw]
      JSON.parse(@map.view_bounds_ne).should eq payload[:view_bounds_ne]
      @map.legends.should eq payload[:legends]
      @map.scrollwheel.should eq payload[:scrollwheel]
    end

    it 'does not update map_id nor user_id' do
      payload = {
        id: 'wadus',
        user_id: 'wadus'
      }

      put_json api_v1_maps_update_url(user_domain: @user.username, api_key: @user.api_key, id: @map.id), payload do |response|
        response.status.should be_success
        response.body[:id].should eq @map.id
        response.body[:user_id].should eq @user.id
      end

      old_map_id = @map.id
      @map.reload
      @map.id.should eq old_map_id
      @map.user_id.should eq @user.id
    end

    it 'returns 401 for unathorized user' do
      put_json api_v1_maps_update_url(user_domain: @user2.username, api_key: 'wadus', id: @map.id), {} do |response|
        response.status.should eq 401
      end
    end

    it 'returns 404 for maps not owned by the user' do
      put_json api_v1_maps_update_url(user_domain: @user2.username, api_key: @user2.api_key, id: @map.id), {center: [1,1]} do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for unexisting map' do
      put_json api_v1_maps_update_url(user_domain: @user.username, api_key: @user.api_key, id: 'wadus'), {} do |response|
        response.status.should eq 404
      end
    end
  end
end
