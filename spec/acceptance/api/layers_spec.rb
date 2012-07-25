# coding: UTF-8
require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 layers management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  before(:each) do
    delete_user_data @user
    @table = create_table(:user_id => @user.id)
    @map = create_map(:user_id => @user.id, :table_id => @table.id)
  end

  scenario "Create a new layer" do
    opts = { opt1: 'wadus', opt2: '1' }

    post_json v1_map_layers_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :map_id => @map.id), { 
      :kind => 'Layer::Base', 
      :options => opts } do |response|
      response.status.should be_success
      @map.layers.size.should == 1
      response.body[:id].should == @map.layers.first.id
      response.body[:options].should == opts.to_json
      response.body[:kind].should == 'Layer::Base'
    end
  end

  scenario "Get layer information" do
    layer = Layer.create
    @map.add_layer layer

    get_json v1_map_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :map_id => @map.id) do |response|
      response.status.should be_success
      response.body[:id].should == layer.id
    end
  end

  scenario "Get a map layers" do
    layer = Layer.create
    layer2 = Layer.create
    @map.add_layer layer
    @map.add_layer layer2

    get_json v1_map_layers_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :map_id => @map.id) do |response|
      response.status.should be_success
      response.body[:total_entries].should == 2
      response.body[:layers].size.should == 2
    end
  end

  scenario "Update a layer" do
    layer = Layer.create
    @map.add_layer layer

    put_json v1_map_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :map_id => @map.id), {
      :options => { :opt1 => 'value' } } do |response|
      response.status.should be_success
      response.body[:id].should == layer.id
      response.body[:options].should == { :opt1 => 'value' }.to_json
    end
  end

  scenario "Drop a layer" do
    layer = Layer.create
    @map.add_layer layer
    
    delete_json v1_map_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :map_id => @map.id) do |response|
      response.status.should be_success
      expect { layer.refresh }.to raise_error
    end
  end
end
