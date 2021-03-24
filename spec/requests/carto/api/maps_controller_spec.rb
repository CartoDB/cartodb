require_relative '../../../spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/maps_controller'

describe Carto::Api::MapsController do
  include Carto::Factories::Visualizations, HelperMethods

  def create_show_map_url(user: @user, map: @map)
    map_url(user_domain: user.subdomain, api_key: user.api_key, id: map.id)
  end

  describe '#update' do
    before(:all) do
      @user = create(:carto_user)
      @user2 = create(:carto_user)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      # This avoids connection leaking.
      ::User[@user.id].destroy
      ::User[@user2.id].destroy
    end

    let(:payload) do
      {
        bounding_box_ne: "[85.0511, 179]",
        bounding_box_sw: "[-85.0511, -179]",
        center: "[28.483177058570757, -82.825927734375]",
        provider: "leaflet",
        view_bounds_ne: "[32.30570601389429, -76.32202148437499]",
        view_bounds_sw: "[24.51713945052515, -89.329833984375]",
        zoom: 7,
        options: {
          dashboard_menu: false,
          legends: true,
          scrollwheel: true,
          layer_selector: true
        }
      }
    end

    it 'updates an existing map' do
      put_json create_show_map_url, payload do |response|
        response.status.should be_success
      end
    end

    it 'validates on update' do
      payload[:options] = { spammy: 'hell', dashboard_menu: true }
      put_json create_show_map_url, payload do |response|
        response.status.should eq 422
      end
    end

    it 'invalidates VizJSON upon update' do
      Carto::VisualizationInvalidationService.any_instance.expects(:invalidate).once
      put_json create_show_map_url, payload do |response|
        response.status.should eq 200
      end
    end

    it 'returns 401 for unauthorized user' do
      put_json map_url(user_domain: @user2.subdomain,
                       api_key: 'wadus',
                       id: @map.id) do |response|
        response.status.should eq 401
      end
    end

    it 'returns 404 for maps not owned by the user' do
      put_json create_show_map_url(user: @user2) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for inexistent map' do
      put_json map_url(user_domain: @user.subdomain,
                       api_key: @user.api_key,
                       id: random_uuid) do |response|
        response.status.should eq 404
      end
    end

    def create_update_map_url(user, map_id)
      map_url(user_domain: user.username, api_key: user.api_key, id: map_id)
    end

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

      put_json create_update_map_url(@user, @map.id), payload do |response|
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

    it 'only updates passed parameters' do
      @map.view_bounds_sw.present?.should be_true
      zoom = @map.zoom + 1
      put_json create_update_map_url(@user, @map.id), zoom: zoom do
        @map.reload
        @map.view_bounds_sw.present?.should be_true
        @map.zoom.should eq zoom
      end
    end

    it 'does not update map_id nor user_id' do
      payload = {
        id: 'c3c1030c-9783-45f4-bd08-022593a682aa',
        user_id: 'c3c1030c-9783-45f4-bd08-022593a682ab'
      }

      put_json create_update_map_url(@user, @map.id), payload do |response|
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
      put_json map_url(user_domain: @user2.username, api_key: 'wadus', id: @map.id) do |response|
        response.status.should eq 401
      end
    end

    it 'returns 404 for maps not owned by the user' do
      put_json create_update_map_url(@user2, @map.id), center: [1, 1] do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for unexisting map' do
      put_json create_update_map_url(@user, 'c3c1030c-9783-45f4-bd08-022593a682ac') do |response|
        response.status.should eq 404
      end
    end
  end

  describe '#show' do
    before(:all) do
      @user = create(:carto_user)
      @user2 = create(:carto_user)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      # This avoids connection leaking.
      ::User[@user.id].destroy
      ::User[@user2.id].destroy
    end

    it 'does not invalidate VizJSON upon show' do
      Carto::Map.any_instance.expects(:force_notify_map_change).never
      get_json create_show_map_url, {} do |response|
        response.status.should eq 200
      end
    end

    it 'returns an existing map' do
      get_json create_show_map_url do |response|
        response.status.should be_success
        response.body[:id].should eq @map.id
        response.body[:user_id].should eq @map.user_id
        response.body[:provider].should eq @map.provider
        response.body[:bounding_box_sw].should eq @map.bounding_box_sw
        response.body[:bounding_box_ne].should eq @map.bounding_box_ne
        response.body[:center].should eq @map.center
        response.body[:zoom].should eq @map.zoom
        response.body[:view_bounds_sw].should eq @map.view_bounds_sw
        response.body[:view_bounds_ne].should eq @map.view_bounds_ne

        response_options = response.body[:options]
        response_options[:dashboard_menu].should eq @map.dashboard_menu
        response_options[:layer_selector].should eq @map.layer_selector
        response_options[:legends].should eq @map.options[:legends]
        response_options[:scrollwheel].should eq @map.options[:scrollwheel]
      end
    end

    it 'returns 401 for unauthorized user' do
      get_json map_url(user_domain: @user2.subdomain,
                       api_key: 'wadus',
                       id: @map.id) do |response|
        response.status.should eq 401
      end
    end

    it 'returns 404 for maps not owned by the user' do
      get_json create_show_map_url(user: @user2) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for inexistent map' do
      get_json map_url(user_domain: @user.subdomain,
                       api_key: @user.api_key,
                       id: random_uuid) do |response|
        response.status.should eq 404
      end
    end
  end
end
