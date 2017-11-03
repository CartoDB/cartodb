# encoding: utf-8

require_relative '../spec_helper'
include Warden::Test::Helpers
include Carto::Factories::Visualizations

def login(user)
  login_as(user, scope: user.username)
  host! "#{user.username}.localhost.lan"
end

describe "UserState"  do

  before(:all) do
    @locked_user = FactoryGirl.create(:carto_locked_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@locked_user)
    @non_locked_user = FactoryGirl.create(:carto_user)
    @dashboard_endpoints = ['/dashboard', '/dashboard/tables', '/dashboard/datasets', '/dashboard/visualizations',
                          '/dashboard/maps'].freeze
    @user_endpoints = ['/me', '/account', '/profile'].freeze
    @tables_endpoints = ["/tables/#{@table.id}", "/tables/#{@table.id}/public",
                         "/tables/#{@table.id}/embed_map", "/viz/#{@visualization.id}"].freeze
    @viz_endpoints = ["/viz/#{@visualization.id}/public", "/viz/#{@visualization.id}/embed_map",
                      "/viz/#{@visualization.id}/public_map", "/builder/#{@visualization.id}",
                      "/builder/#{@visualization.id}/embed"].freeze
    @api_endpoints = ["/api/v1/viz", "/api/v1/viz/#{@visualization.id}", "/api/v1/tables/#{@table.id}",
                      "/api/v1/tables/#{@table.id}/columns",
                      "/api/v1/imports", "/api/v1/users/#{@locked_user.id}/layers", "/api/v1/synchronizations",
                      "/api/v1/geocodings", "/api/v1/users/#{@locked_user.id}", "/api/v2/viz/#{@visualization.id}/viz",
                      "/api/v3/me", "/api/v3/viz/#{@visualization.id}/viz"].freeze
    @headers = {}
  end

  after(:all) do
    @user.destroy
  end

  describe '#locked user' do
    it 'owner accessing their resources' do
      login(@locked_user)
      @dashboard_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/upgrade_trial'
        response.status.should == 200
      end
      @user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/upgrade_trial'
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/upgrade_trial'
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        response.status.should == 302
        follow_redirect!
        request.path.should == '/upgrade_trial'
        response.status.should == 200
      end
      api_headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
      @api_endpoints.each do |endpoint|
        get "#{endpoint}?api_key=#{@locked_user.api_key}", {}, @headers
        response.status.should == 404
      end
    end
    it 'user accessing a locked user resources' do
      login(@non_locked_user)
      host! "#{@locked_user.username}.localhost.lan"
      @user_endpoints.each do |endpoint|
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
      api_headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
      @api_endpoints.each do |endpoint|
        get "#{endpoint}", {}, @headers
        response.status.should == 404
      end
    end
    it 'non-logged user accessing a locked user resources' do
      host! "#{@locked_user.username}.localhost.lan"
      @user_endpoints.each do |endpoint|
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
      api_headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
      @api_endpoints.each do |endpoint|
        get "#{endpoint}", {}, @headers
        response.status.should == 404
      end
    end
  end
end
