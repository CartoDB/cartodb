# encoding: utf-8
require_relative '../../acceptance_helper'

feature "API 1.0 users management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
  end

  scenario "Get standard information for the user by id" do
    layer = Layer.create :kind => 'carto', :order => 2
    layer2 = Layer.create :kind => 'tiled', :order => 1
    @user.add_layer layer
    @user.add_layer layer2

    get_json api_user_url(@user.id) do |response|
      response.body[:id].should == @user.id
      response.body.keys.should_not include(:password)
      response.status.should be_success      
    end
  end

  scenario "Get standard information without api_key" do
    get_json "#{api_url_prefix}/users/#{@user.id}" do
      response.status.should == 401
    end
  end

  scenario "Get standard information for the user by username" do    
    @user
    get_json api_user_url(@user.username) do |response|
      response.status.should be_success      
    end
  end
end

