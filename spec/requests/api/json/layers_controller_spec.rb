# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/layers_controller'
require_relative 'layers_controller_shared_examples'

describe Api::Json::LayersController do
  include Carto::Factories::Visualizations

  it_behaves_like 'layers controllers' do
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

  include_context 'users helper'

  describe '#create' do
    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      @layer.destroy if @layer
      @layer2.destroy if @layer2
    end

    let(:kind) { 'carto' }

    let(:create_layer_url) do
      api_v1_users_layers_create_url(user_domain: @user1.username, user_id: @user1.id, api_key: @user1.api_key)
    end

    def create_map_layer_url(map_id)
      api_v1_maps_layers_create_url(user_domain: @user1.username, map_id: map_id, api_key: @user1.api_key)
    end

    def update_map_layer_url(map_id, layer_id = nil)
      api_v1_maps_layers_update_url(
        user_domain: @user1.username,
        map_id: map_id,
        id: layer_id,
        api_key: @user1.api_key)
    end

    def delete_map_layer_url(map_id, layer_id)
      api_v1_maps_layers_destroy_url(
        user_domain: @user1.username,
        map_id: map_id,
        id: layer_id,
        api_key: @user1.api_key)
    end

    let(:layer_json) do
      { kind: kind, options: { 'table_name' => nil, 'user_name' => nil }, order: 1, infowindow: {}, tooltip: {} }
    end

    it 'creates layers' do
      post_json create_layer_url, layer_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response.delete(:id).should_not be_nil
        layer_response.should eq layer_json
      end
    end

    it 'creates layers on maps' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1)
      # Let's make room for another layer of the same kind
      destroyed_layer = @map.layers.where(kind: layer_json[:kind]).first
      destroyed_layer.destroy if destroyed_layer

      post_json create_map_layer_url(@map.id), layer_json.merge(options: { table_name: @table.name }) do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_id = layer_response.delete(:id)
        layer_id.should_not be_nil

        layer_response.delete(:options).should eq ({ "table_name" => @table.name })

        layer_response.should eq layer_json.except(:options)

        @layer = Carto::Layer.find(layer_id)
        @layer.maps.map(&:id).first.should eq @map.id
      end
    end

    it 'does not allow to exceed max_layers' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1)
      @carto_user1.max_layers = @map.layers.count
      @carto_user1.save

      post_json create_map_layer_url(@map.id), layer_json.merge(kind: 'tiled', order: 10) do |response|
        response.status.should eq 403
      end
    end

    it 'updates one layer' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first

      new_order = 2
      new_layer_json = layer_json.merge(
        options: { 'random' => '1' },
        order: new_order
      )
      put_json update_map_layer_url(map.id, @layer.id), new_layer_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response[:id].should eq @layer.id
        layer_response[:options].should eq new_layer_json[:options]
        layer_response[:order].should eq new_order
      end
    end

    it 'updates several layers at once' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first
      @layer2 = FactoryGirl.create(:carto_layer, maps: [map])

      new_order = 2
      new_layer_json = layer_json.merge(
        options: { 'random' => '1' },
        order: new_order
      )
      new_layers_json = {
        layers: [
          new_layer_json.merge(id: @layer.id),
          new_layer_json.merge(id: @layer2.id)
        ]
      }
      put_json update_map_layer_url(map.id), new_layers_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response[:layers].map { |l| l['id'] }.should eq [@layer.id, @layer2.id]
        layer_response[:layers].each do |layer|
          layer['options'].should eq new_layer_json[:options]
          layer['order'].should eq new_order
        end
      end
    end

    it 'does not update table_name or users_name options' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first

      new_layer_json = layer_json.merge(
        options: { 'table_name' => 'other_table_name', 'user_name' => 'other_username' }
      )
      put_json update_map_layer_url(map.id, @layer.id), new_layer_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response[:options].should eq layer_json[:options]
      end
    end

    it 'destroys layers' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first

      delete_json delete_map_layer_url(map.id, @layer.id), {} do |response|
        response.status.should eq 204
        Carto::Layer.exists?(@layer.id).should be_false
      end
    end
  end
end
