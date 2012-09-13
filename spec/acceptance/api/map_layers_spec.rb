# coding: UTF-8
require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 map layers management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  before(:each) do
    delete_user_data @user
    @table = create_table(:user_id => @user.id)
    @map = create_map(:user_id => @user.id, :table_id => @table.id)
  end

  scenario "Create a new layer associated to a map" do
    opts = { "type" => "GMapsBase", "base_type" => "roadmap", "style" => "null", "order" => "0" }
    infowindow = ['column1', 'column2', 'column3']

    post_json v1_map_layers_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :map_id => @map.id), { 
      :kind => 'gmapsbase', 
      :infowindow => infowindow,
      :order => 0,
      :options => opts } do |response|
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
    layer = Layer.create :kind => 'carto', :order => 1
    @map.add_layer layer

    get_json v1_map_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :map_id => @map.id) do |response|
      response.status.should be_success
      response.body[:id].should == layer.id
      response.body[:kind].should == 'carto'
      response.body[:order].should == 1
    end
  end

  scenario "Get all map layers" do
    layer  = Layer.create :kind => 'carto', :order => 3
    layer2 = Layer.create :kind => 'tiled', :order => 2
    layer3 = Layer.create :kind => 'tiled', :order => 1
    @map.add_layer layer
    @map.add_layer layer2
    @map.add_layer layer3

    get_json v1_map_layers_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :map_id => @map.id) do |response|
      response.status.should be_success
      response.body[:total_entries].should == 3
      response.body[:layers].size.should == 3
      response.body[:layers][0]['id'].should == layer3.id
      response.body[:layers][1]['id'].should == layer2.id
      response.body[:layers][2]['id'].should == layer.id
    end
  end

  scenario "Update a layer" do
    layer = Layer.create :kind => 'carto', :order => 0
    @map.add_layer layer

    put_json v1_map_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :map_id => @map.id), {
      :options => { :opt1 => 'value' },
      :infowindow => ['column1', 'column2'], 
      :order => 3,
      :kind => 'carto' } do |response|
      response.status.should be_success
      response.body[:id].should == layer.id
      response.body[:options].should == { 'opt1' => 'value' }
      response.body[:infowindow].should == ['column1', 'column2']
      response.body[:kind].should == 'carto'      
      response.body[:order].should == 3
    end
  end

  scenario "Drop a layer" do
    layer = Layer.create :kind => 'carto'
    @map.add_layer layer
    
    delete_json v1_map_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :map_id => @map.id) do |response|
      response.status.should be_success
      expect { layer.refresh }.to raise_error
    end
  end
end
