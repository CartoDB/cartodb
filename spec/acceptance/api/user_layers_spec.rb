# coding: UTF-8
require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 user layers management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  before(:each) do
    delete_user_data @user
    @table = create_table(:user_id => @user.id)
  end

  scenario "Create a new layer associated to the current user" do
    post_json v1_user_layers_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :user_id => @user.id), { 
      :kind => 'carto' } do |response|
      response.status.should be_success
      @user.layers.size.should == 1
      response.body[:id].should == @user.layers.first.id
    end
  end

  scenario "Get all user layers" do
    layer = Layer.create :kind => 'carto'
    layer2 = Layer.create :kind => 'tiled'
    @user.add_layer layer
    @user.add_layer layer2

    get_json v1_user_layers_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :user_id => @user.id) do |response|
      response.status.should be_success
      response.body[:total_entries].should == 2
      response.body[:layers].size.should == 2
      response.body[:layers][0]['id'].should == layer.id
    end
  end

  scenario "Update a layer" do
    layer = Layer.create :kind => 'carto'
    @user.add_layer layer

    put_json v1_user_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :user_id => @user.id), {
      :options => { :opt1 => 'value' },
      :infowindow => ['column1', 'column2'], 
      :kind => 'carto' } do |response|
      response.status.should be_success
      response.body[:id].should == layer.id
      response.body[:options].should == { 'opt1' => 'value' }
      response.body[:infowindow].should == ['column1', 'column2']
      response.body[:kind].should == 'carto'      
    end
  end

  scenario "Drop a layer" do
    layer = Layer.create :kind => 'carto'
    @user.add_layer layer
    
    delete_json v1_user_layer_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => layer.id, :user_id => @user.id) do |response|
      response.status.should be_success
      expect { layer.refresh }.to raise_error
    end
  end
end
