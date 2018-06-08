# encoding: utf-8

require_relative '../spec_helper'
include Warden::Test::Helpers
include Carto::Factories::Visualizations

def login(user)
  login_as(user, scope: user.username)
  host! "#{user.username}.localhost.lan"
end

def follow_redirects(limit = 10)
  while response.redirect? && (limit -= 1) > 0
    follow_redirect!
  end
end

describe "UserState" do

  before(:all) do
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'no_free_tier', restricted: false)
    @locked_user = FactoryGirl.create(:locked_user)
    @map, @table, @table_visualization, @visualization = create_full_builder_vis(@locked_user)
    @visualization.create_mapcap!
    @non_locked_user = FactoryGirl.create(:valid_user)
    @dashboard_endpoints = ['/dashboard', '/dashboard/tables', '/dashboard/datasets', '/dashboard/visualizations',
                            '/dashboard/maps'].freeze
    @public_user_endpoints = ['/me'].freeze
    @user_endpoints = ['/account', '/profile'].freeze
    @tables_endpoints = ["/tables/#{@table.id}", "/tables/#{@table.id}/public",
                         "/tables/#{@table.id}/embed_map"].freeze
    @viz_endpoints = ["/viz/#{@visualization.id}/public",
                      "/viz/#{@visualization.id}/embed_map", "/viz/#{@visualization.id}/public_map",
                      "/builder/#{@visualization.id}", "/builder/#{@visualization.id}/embed"].freeze
    @public_api_endpoints = ["/api/v1/viz", "/api/v1/viz/#{@visualization.id}",
                             "/api/v2/viz/#{@visualization.id}/viz",
                             "/api/v3/me", "/api/v3/viz/#{@visualization.id}/viz"].freeze
    @private_api_endpoints = ["/api/v1/tables/#{@table.id}", "/api/v1/tables/#{@table.id}/columns",
                              "/api/v1/imports", "/api/v1/users/#{@locked_user.id}/layers",
                              "/api/v1/synchronizations", "/api/v1/geocodings",
                              "/api/v1/users/#{@locked_user.id}"]
    @headers = {}
    @api_headers = { 'CONTENT_TYPE' => 'application/json', :format => "json" }
  end

  after(:all) do
    @locked_user.destroy
    @non_locked_user.destroy
  end

  describe '#locked user' do
    it 'owner accessing their resources' do
      login(@locked_user)
      @dashboard_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/lockout'
        response.status.should == 200
      end
      @user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/lockout'
        response.status.should == 200
      end
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/lockout'
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/lockout'
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/lockout'
        response.status.should == 200
      end
      @private_api_endpoints.each do |endpoint|
        get "#{endpoint}?api_key=#{@locked_user.api_key}", {}, @api_headers
        request.path == endpoint
        response.status.should == 404
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path == endpoint
        response.status.should == 404
      end
    end

    it 'locked user can delete their own account' do
      to_be_deleted_user = FactoryGirl.create(:locked_user)
      to_be_deleted_user.password = 'pwd123'
      to_be_deleted_user.password_confirmation = 'pwd123'
      to_be_deleted_user.save

      login(to_be_deleted_user)
      delete account_delete_user_url, deletion_password_confirmation: 'pwd123'

      expect(User.find(id: to_be_deleted_user.id)).to be_nil
    end

    it 'user accessing a locked user resources' do
      login(@non_locked_user)
      host! "#{@locked_user.username}.localhost.lan"
      @user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path == endpoint
        response.status.should == 404
      end
    end
    it 'non-logged user accessing a locked user resources' do
      host! "#{@locked_user.username}.localhost.lan"
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 404
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path == endpoint
        response.status.should == 404
      end
    end
  end
  describe '#non locked user' do
    before(:all) do
      @locked_user.state = 'active'
      @locked_user.save
    end
    after(:all) do
      @locked_user.state = 'locked'
      @locked_user.save
    end
    it 'owner accessing their resources' do
      Admin::UsersController.any_instance.stubs(:render)
      login(@locked_user)
      host! "#{@locked_user.username}.localhost.lan"
      @dashboard_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @private_api_endpoints.each do |endpoint|
        get "#{endpoint}?api_key=#{@locked_user.api_key}", {}, @api_headers
        request.path == endpoint
        response.status.should == 200
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path == endpoint
        response.status.should == 200
      end
    end
    it 'non locked user accessing a locked user resources' do
      login(@non_locked_user)
      @user_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @public_user_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path == endpoint
        response.status.should == 200
      end
    end
    it 'non-logged user accessing a locked user resources' do
      host! "#{@locked_user.username}.localhost.lan"
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path == endpoint
        response.status.should == 200
      end
    end
  end
end
