# encoding: utf-8
require_relative '../../acceptance_helper'

feature "API 1.0 map layers management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user(username: 'test')
  end

  before(:each) do
    delete_user_data @user
    host! 'test.localhost.lan'
    @table = create_table(user_id: @user.id)
    @map = create_map(user_id: @user.id, table_id: @table.id)
  end

  let(:params) { { api_key: @user.api_key } }

  scenario "Create a new layer associated to a map" do
    opts = { "type" => "GMapsBase", "base_type" => "roadmap", "style" => "null", "order" => "0" }
    infowindow = ['column1', 'column2', 'column3']

    data = { kind: 'gmapsbase', infowindow: infowindow, options: opts }

    post_json v1_map_layers_url(params.merge(map_id: @map.id)), data do |response|
      response.status.should be_success
      @map.layers.size.should == 1
      response.body[:id].should == @map.layers.first.id
      response.body[:options].should == opts
      response.body[:infowindow].should == infowindow
      response.body[:order].should == 0
      response.body[:kind].should == 'gmapsbase'
    end
  end

  scenario "Get layer information" do
    layer = Layer.create kind: 'carto', order: 1, options: { opt1: 'value' }, infowindow: ['column1', 'column2']
    @map.add_layer layer

    get_json v1_map_layer_url(params.merge(id: layer.id, map_id: @map.id)) do |response|
      response.status.should be_success
      response.body[:id].should    eq layer.id
      response.body[:kind].should  eq 'carto'
      response.body[:order].should eq 1
    end
  end

  scenario "Get all map layers" do
    layer  = Layer.create kind: 'carto', order: 3
    layer2 = Layer.create kind: 'tiled', order: 2
    layer3 = Layer.create kind: 'tiled', order: 1
    @map.add_layer layer
    @map.add_layer layer2
    @map.add_layer layer3

    get_json v1_map_layers_url(params.merge(map_id: @map.id)) do |response|
      response.status.should be_success
      response.body[:total_entries].should == 3
      response.body[:layers].size.should == 3
      response.body[:layers][0]['id'].should == layer3.id
      response.body[:layers][1]['id'].should == layer2.id
      response.body[:layers][2]['id'].should == layer.id
    end
  end

  scenario "Update a layer" do
    layer = Layer.create kind: 'carto', order: 0
    @map.add_layer layer

    data = { options: { opt1: 'value' }, infowindow: ['column1', 'column2'], order: 3, kind: 'carto' }

    put_json v1_map_layer_url(params.merge(id: layer.id, map_id: @map.id)), data do |response|
      response.status.should be_success
      response.body[:id].should == layer.id
      response.body[:options].should == { 'opt1' => 'value' }
      response.body[:infowindow].should == ['column1', 'column2']
      response.body[:kind].should == 'carto'      
      response.body[:order].should == 3
    end
  end

  scenario "Update a layer > tiler error" do
    layer = Layer.create kind: 'carto', order: 0
    @map.add_layer layer
    Layer.any_instance.stubs(:after_save).raises(RuntimeError)

    data = { options: { opt1: 'value' }, infowindow: ['column1', 'column2'], order: 999, kind: 'carto' }

    put_json v1_map_layer_url(params.merge(id: layer.id, map_id: @map.id)), data do |response|
      response.status.should eq 400
      layer.reload.order.should_not eq 999
    end
  end

  scenario "Drop a layer" do
    layer = Layer.create kind: 'carto'
    @map.add_layer layer
    
    delete_json v1_map_layer_url(params.merge(id: layer.id, map_id: @map.id)) do |response|
      response.status.should eq 204
      expect { layer.refresh }.to raise_error
    end
  end
end
