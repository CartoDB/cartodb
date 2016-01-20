# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::Api::WidgetsController do
  include_context 'users helper'

  before(:all) do
    @map = FactoryGirl.create(:carto_map_with_layers)
    @layer = @map.layers.first
    @widget = FactoryGirl.create(:widget, layer: @layer)
  end

  after(:all) do
    @widget.destroy if @widget
  end

  let(:random_map_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_layer_id) { UUIDTools::UUID.timestamp_create.to_s }
  let(:random_widget_id) { UUIDTools::UUID.timestamp_create.to_s }

  describe '#show' do
    it 'returns 401 for non-authenticated requests' do
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

  end
end
