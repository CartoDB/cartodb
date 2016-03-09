# encoding: utf-8

require_relative '../../../spec_helper_min'
require_relative '../../../../app/controllers/carto/api/maps_controller'
require_relative '../../../../spec/requests/api/json/maps_controller_shared_examples'


describe Carto::Api::MapsController do

  it_behaves_like 'maps controllers' do
  end

  include Carto::Factories::Visualizations
  include HelperMethods

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @user2 = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    # This avoids connection leaking.
    ::User[@user.id].destroy
    ::User[@user2.id].destroy
  end

  describe '#show' do
    it 'returns existing map by id' do
      get_json api_v1_maps_show_url(user_domain: @user.username, api_key: @user.api_key, id: @map.id) do |response|
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
        response.body[:legends].should eq @map.legends
        response.body[:scrollwheel].should eq @map.scrollwheel
      end
    end

    it 'returns 401 for unathorized user' do
      get_json api_v1_maps_show_url(user_domain: @user2.username, api_key: 'wadus', id: @map.id) do |response|
        response.status.should eq 401
      end
    end

    it 'returns 404 for maps not owned by the user' do
      get_json api_v1_maps_show_url(user_domain: @user2.username, api_key: @user2.api_key, id: @map.id) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for unexisting map' do
      get_json api_v1_maps_show_url(user_domain: @user.username, api_key: @user.api_key, id: 'wadus') do |response|
        response.status.should eq 404
      end
    end
  end
end
