# coding: UTF-8
require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 maps management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  before(:each) do
    delete_user_data @user
  end

  scenario "Create a new map" do
    table = create_table(:user_id => @user.id)
    post_json v1_maps_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key), { :table_id => table.id } do |response|
      response.status.should be_success
      table.refresh
      table.map_id.should == response.body[:id]
    end
  end

  scenario "Get map information" do
    table = create_table(:user_id => @user.id)
    map = create_map(:user_id => @user.id, :table_id => table.id)

    get_json v1_map_url(:host => CartoDB.hostname.sub('http://', ''), :api_key => api_key, :id => map.id) do |response|
      response.status.should be_success
      response.body[:id].should == map.id
    end
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

end