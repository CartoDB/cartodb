# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../app/controllers/admin/visualizations_controller'

def app
  CartoDB::Application.new
end #app

describe Admin::VisualizationsController do
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:all) do

    @user = create_user(
      username: 'test',
      email:    'test@test.com',
      password: 'test'
    )
    @api_key = @user.api_key
  end

  before(:each) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    
    @db = Sequel.sqlite
    Sequel.extension(:pagination)

    CartoDB::Visualization::Migrator.new(@db).migrate
    CartoDB::Visualization.repository  = 
      DataRepository::Backend::Sequel.new(@db, :visualizations)

    delete_user_data @user
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'GET /viz' do
    it 'returns a list of visualizations' do
      login_as(@user, scope: 'test')

      get "/viz", {}, @headers
      last_response.status.should == 200
    end

    it 'returns 403 if user not logged in' do
      get "/viz", {}, @headers
      last_response.status.should == 302
    end
  end # GET /viz

  describe 'GET /viz:id' do
    it 'returns a visualization' do
      id = factory.fetch('id')
      login_as(@user, scope: 'test')

      get "/viz/#{id}", {}, @headers
      last_response.status.should == 200
    end

    it 'redirects to the public view if visualization private' do
      id = factory.fetch('id')

      get "/viz/#{id}", {}, @headers
      follow_redirect!
      last_request.path.should =~ %r{/viz/}
    end

    it 'keeps the base path (table|visualization) when redirecting' do
      id = table_factory.id

      get "/tables/#{id}", {}, @headers
      follow_redirect!
      last_request.path.should =~ %r{/tables/}
    end
  end # GET /viz/:id

  describe 'GET /viz/:id/public' do
    it 'returns public data for a table visualization' do
      id = table_factory(privacy: ::Table::PUBLIC).table_visualization.id

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 200
    end

    it 'returns a 404 if table is private' do
      id = table_factory.table_visualization.id

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 404
      last_response.body.should =~ %r{<title>CartoDB - 404 Error</title>}
    end

    it "redirects to embed_map if visualization is 'derived'" do
      id                = table_factory(privacy: ::Table::PUBLIC).table_visualization.id
      payload           = { source_visualization_id: id }

      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers
      last_response.status.should == 200

      derived_visualization = JSON.parse(last_response.body)
      id = derived_visualization.fetch('id')

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 302
      follow_redirect!
      last_response.status.should == 200
      last_request.url.should =~ %r{.*#{id}/public_map.*}
    end
  end # GET /viz/:id/public

  describe 'GET /viz/:name/embed_map' do
    it 'renders the view by passing a visualization name' do
      table = table_factory(privacy: ::Table::PUBLIC)
      name = table.table_visualization.name

      get "/viz/#{URI::encode(name)}/embed_map", {}, @headers
      last_response.status.should == 200
      last_response.headers["X-Cache-Channel"].should_not be_empty
      last_response.headers["X-Cache-Channel"].should include(table.name)
      last_response.headers["X-Cache-Channel"].should include(table.table_visualization.varnish_key)
    end

    it 'renders embed_map.js' do
      id                = table_factory(privacy: ::Table::PUBLIC).table_visualization.id
      payload           = { source_visualization_id: id }

      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers
      last_response.status.should == 200

      derived_visualization = JSON.parse(last_response.body)
      id = derived_visualization.fetch('id')

      login_as(@user, scope: 'test')

      get "/viz/#{id}/embed_map.js", {}, @headers
      last_response.status.should == 200
    end

    it 'renders embed map error page if visualization private' do
      table = table_factory
      put "/api/v1/tables/#{table.id}?api_key=#{@api_key}",
        { privacy: 0 }.to_json, @headers

      name = table.table_visualization.name
      name = URI::encode(name)

      login_as(@user, scope: 'test')

      get "/viz/#{name}/embed_map", {}, @headers
      last_response.status.should == 403
      last_response.body.should =~ /cartodb-embed-error/

      get "/viz/#{name}/embed_map.js", {}, @headers
      last_response.status.should == 403
      last_response.body.should =~ /get_url_params/
    end

    it 'renders embed map error when an exception is raised' do
      login_as(@user, scope: 'test')

      get "/viz/non_existent/embed_map", {}, @headers
      last_response.status.should == 404
      last_response.body.should =~ /pity/

      get "/viz/non_existent/embed_map.js", {}, @headers
      last_response.status.should == 404
      last_response.body.should =~ /pity/
    end
  end # GET /viz/:name/embed_map

  describe 'GET /viz/:name/track_embed' do
    it 'renders the view by passing a visualization name' do
      name = URI::encode(factory.fetch('name'))
      login_as(@user, scope: 'test')

      get "/viz/track_embed", {}, @headers
      last_response.status.should == 200
    end
  end # GET /viz/:name/track_embed

  describe 'non existent visualization' do
    it 'returns 404' do
      login_as(@user, scope: 'test')

      get "/viz/9999?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/viz/9999/public?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/viz/9999/embed_map?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404
    end
  end # non existent visualization

  def factory
    map     = Map.create(user_id: @user.id)
    payload = {
      name:         "visualization #{rand(9999)}",
      tags:         ['foo', 'bar'],
      map_id:       map.id,
      description:  'bogus',
      type:         'derived'
    }
    post "/api/v1/viz?api_key=#{@api_key}",
      payload.to_json, @headers

    JSON.parse(last_response.body)
  end #factory

  def table_factory(attrs = {})
    new_table(attrs.merge(user_id: @user.id)).save.reload
  end #table_factory
end # Admin::VisualizationsController
