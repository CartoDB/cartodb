# encoding: utf-8
require_relative '../../acceptance_helper'

feature "API 1.0 user layers management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user(username: 'test')
  end

  before(:each) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    delete_user_data @user
    host! 'test.localhost.lan'
    @table = create_table(:user_id => @user.id)
  end

  let(:params) { { api_key: @user.api_key } }

  scenario "Create a new layer associated to the current user" do
    opts = { kind: 'carto' }

    post_json v1_user_layers_url(params.merge(user_id: @user.id)), opts do |response|
      response.status.should    be_success
      @user.layers.size.should  eq 1
      response.body[:id].should eq @user.layers.first.id
    end
  end

  scenario "Get all user layers" do
    layer = Layer.create kind: 'carto'
    layer2 = Layer.create kind: 'tiled'
    @user.add_layer layer
    @user.add_layer layer2

    get_json v1_user_layers_url(params.merge(user_id: @user.id)) do |response|
      response.status.should be_success
      response.body[:total_entries].should   eq 2
      response.body[:layers].size.should     eq 2
      response.body[:layers][0]['id'].should eq layer.id
    end
  end

  scenario "Update a layer" do
    layer = Layer.create kind: 'carto'
    @user.add_layer layer
    opts = { options: { opt1: 'value' }, infowindow: ['column1', 'column2'], kind: 'carto' }

    put_json v1_user_layer_url(params.merge(id: layer.id, user_id: @user.id)), opts do |response|
      response.status.should be_success
      response.body[:id].should         eq layer.id
      response.body[:options].should    == { 'opt1' => 'value' }
      response.body[:infowindow].should eq ['column1', 'column2']
      response.body[:kind].should       eq 'carto'      
    end
  end

  scenario "Drop a layer" do
    layer = Layer.create :kind => 'carto'
    @user.add_layer layer
    
    delete_json v1_user_layer_url(params.merge(id: layer.id, user_id: @user.id)) do |response|
      response.status.should eq 204
      expect { layer.refresh }.to raise_error
    end
  end
end
