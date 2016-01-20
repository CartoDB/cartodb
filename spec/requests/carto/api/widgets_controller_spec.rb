# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::Api::WidgetsController do
  include_context 'users helper'

  before(:each) do
    @public_map = FactoryGirl.create(:carto_map_with_layers)
    @public_layer = @public_map.layers.first
    @public_widget = FactoryGirl.create(:widget, layer: @public_layer)

    @public_visualization = FactoryGirl.create(:carto_visualization, map: @public_map, privacy: Carto::Visualization::PRIVACY_PUBLIC, user_id: @user1.id)

    @map = FactoryGirl.create(:carto_map_with_layers)
    @layer = @map.layers.first
    @widget = FactoryGirl.create(:widget, layer: @layer)

    @visualization = FactoryGirl.create(:carto_visualization, map: @map, privacy: Carto::Visualization::PRIVACY_PRIVATE, user_id: @user1.id)
  end

  after(:each) do
    @public_visualization.destroy if @public_visualization
    @public_widget.destroy if @public_widget

    @visualization.destroy if @visualization
    @widget.destroy if @widget
  end

  let(:random_map_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_layer_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_widget_id) { UUIDTools::UUID.timestamp_create.to_s }

  describe '#show' do

    # TODO: is #show needed outside the private editor?
    xit 'returns 401 for non-authenticated requests' do
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: random_map_id, layer_id: random_layer_id, widget_id: random_widget_id), {}, http_json_headers do |response|
        response.status.should == 401
      end
    end

    it 'returns 404 for requests without matching map, layer or widget' do
      map_id = @map.id
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: random_map_id, layer_id: @layer.id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: map_id, layer_id: random_layer_id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: map_id, layer_id: @widget.layer_id, widget_id: random_widget_id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end

    end

    it 'returns the source widget content' do
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: @map.id, layer_id: @widget.layer_id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        response.body[:widget_json].should == @widget.widget_json
      end
    end

    it 'returns the source widget content' do
      get_json api_v3_widgets_show_url(user_domain: @user1.username, map_id: @map.id, layer_id: @widget.layer_id, widget_id: @widget.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        response.body[:widget_json].should == @widget.widget_json
      end
    end

    it 'returns 403 if visualization is private and current user is not the owner' do
      get_json api_v3_widgets_show_url(user_domain: @user2.username, map_id: @map.id, layer_id: @widget.layer_id, widget_id: @widget.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end

    it 'returns the source widget content for public visualizations even without authentication' do
      get_json api_v3_widgets_show_url(user_domain: @user2.username, map_id: @public_map.id, layer_id: @public_widget.layer_id, widget_id: @public_widget.id), {}, http_json_headers do |response|

        response.status.should == 200
        response.body[:widget_json].should == @public_widget.widget_json
      end
    end

  end
end
