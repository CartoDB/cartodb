# encoding: utf-8
require_relative '../../acceptance_helper'

feature  "API 1.0 maps management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  scenario "Create a new map" do
    table = create_table(:user_id => @user.id)
    post_json v1_maps_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key), { :table_id => table.id } do |response|
      response.status.should be_success
      table.refresh
      table.map.should == Map[response.body[:id]]
    end
  end

  scenario "Create a new google map" do
    table = create_table(:user_id => @user.id)
    data = { table_id: table.id, center: "[41.68932225997044,-13.4912109375]", zoom: 5, minZoom: 0, maxZoom: 20, provider: "googlemaps", id: 24, user_id: 2,bounding_box_sw: "[0,0]", bounding_box_ne: "[0,0]" }

    post_json v1_maps_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key), data do |response|
      response.status.should be_success
      table.refresh
      table.map.should == Map[response.body[:id]]
      response.body[:center].should == "[41.68932225997044,-13.4912109375]"
      response.body[:zoom].should == 5
      response.body[:bounding_box_sw].should == "[0,0]"
      response.body[:bounding_box_ne].should == "[0,0]"
    end
  end

  scenario "Can't create a map associated to another user's table" do
    another_user  = create_user({:username => 'waldo'})
    table = create_table(:user_id => another_user.id)
    data = { table_id: table.id }

    post_json v1_maps_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key), data do |response|
      response.status.should_not be_success
    end

    another_user.destroy
  end

  scenario "Update a map" do
    table = create_table(:user_id => @user.id)
    map = create_map(:user_id => @user.id, :table_id => table.id)

    put_json v1_map_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => map.id), {:center => "center_value"} do |response|
      response.status.should be_success
      response.body[:id].should == map.id
      response.body[:center].should == "center_value"
    end
  end

  scenario "Drop a map" do
    table = create_table(:user_id => @user.id)
    map = create_map(:user_id => @user.id, :table_id => table.id)
    
    delete_json v1_map_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => map.id) do |response|
      response.status.should eql(204)
    end
  end
end
