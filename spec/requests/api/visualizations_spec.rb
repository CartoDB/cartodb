# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../../app/controllers/api/json/visualizations_controller'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../app/models/overlay/migrator'


def app
  CartoDB::Application.new
end #app

describe Api::Json::VisualizationsController do
  include Rack::Test::Methods
  include DataRepository

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex'
    )
    @user.set_map_key
    @api_key = @user.get_map_key
  end

  before(:each) do
    @db = Sequel.sqlite
    Sequel.extension(:pagination)

    CartoDB::Visualization::Migrator.new(@db).migrate
    CartoDB::Visualization.repository  = 
      DataRepository::Backend::Sequel.new(@db, :visualizations)

    CartoDB::Overlay::Migrator.new(@db).migrate
    CartoDB::Overlay.repository        =
      DataRepository::Backend::Sequel.new(@db, :overlays)

    delete_user_data @user
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'POST /api/v1/viz' do
    it 'creates a visualization' do
      payload = factory

      post "/api/v1/viz?api_key=#{@api_key}",
            payload.to_json, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)

      response.fetch('name')        .should =~ /visualization/
      response.fetch('tags')        .should == payload.fetch(:tags)
      response.fetch('map_id')      .should == payload.fetch(:map_id)
      response.fetch('description') .should == payload.fetch(:description)
      id = response.fetch('id')

      get "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should ==  200

      response = JSON.parse(last_response.body)
      response.fetch('name')        .should_not == nil
      response.fetch('tags')        .should_not == payload.fetch(:tags).to_json
    end
  end # POST /api/v1/viz

  describe 'GET /api/v1/viz' do
    it 'retrieves a collection of visualizations' do
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.first.fetch('id').should == id
    end

    it 'is updated after creating a visualization' do
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers

      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 1

      payload = factory.merge('name' => 'another one')
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 2
    end

    it 'is updated after deleting a visualization' do
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should_not be_empty

      delete "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should be_empty
    end

    it 'paginates results' do
      per_page = 10

      20.times do 
        post "/api/v1/viz?api_key=#{@api_key}",
          factory.to_json, @headers
      end

      get "/api/v1/viz?api_key=#{@api_key}&page=1&per_page=#{per_page}", {}, @headers

      last_response.status.should == 200
      
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should == per_page
    end

    it 'returns filtered results' do
      post "/api/v1/viz?api_key=#{@api_key}",
        factory.to_json, @headers

      get "/api/v1/viz?api_key=#{@api_key}&type=table",
        {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should be_empty

      post "/api/v1/viz?api_key=#{@api_key}",
        factory.to_json, @headers
      post "/api/v1/viz?api_key=#{@api_key}",
        factory.merge(type: 'table').to_json, @headers
      get "/api/v1/viz?api_key=#{@api_key}&type=derived",
        {}, @headers

      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 2
    end
  end # GET /api/v1/viz

  describe 'GET /api/v1/viz/:id' do
    it 'returns a visualization' do
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/viz/#{id}?api_key=#{@api_key}", 
        {}, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)

      response.fetch('id')              .should_not be_nil
      response.fetch('map_id')          .should_not be_nil
      response.fetch('tags')            .should_not be_empty
      response.fetch('description')     .should_not be_nil
      response.fetch('related_tables')  .should_not be_nil
    end
  end # GET /api/v1/viz/:id

  describe 'PUT /api/v1/viz/:id' do
    it 'updates an existing visualization' do
      payload   = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      response  =  JSON.parse(last_response.body)
      id        = response.fetch('id')
      tags      = response.fetch('tags')

      response.fetch('tags').should == ['foo', 'bar']

      put "/api/v1/viz/#{id}?api_key=#{@api_key}",
        { name: 'changed', tags: [] }.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('name').should == 'changed'
      response.fetch('tags').should == []
    end
  end # PUT /api/v1/viz/:id

  describe 'DELETE /api/v1/viz/:id' do
    it 'deletes the visualization' do
      payload   = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      id = JSON.parse(last_response.body).fetch('id')
      get "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      delete "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 204
      last_response.body.should be_empty

      get "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end

    it 'deletes the associated table' do
      table_attributes = table_factory
      table_id         = table_attributes.fetch('id')

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      table             = JSON.parse(last_response.body)
      visualization_id  = table.fetch('table_visualization').fetch('id')

      delete "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 204

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end
  end # DELETE /api/v1/viz/:id

  describe 'DELETE /api/v1/tables/:id' do
    it 'deletes the associated table visualization' do
      table_attributes = table_factory
      table_id         = table_attributes.fetch('id')

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      table             = JSON.parse(last_response.body)
      visualization_id  = table.fetch('table_visualization').fetch('id')

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      delete "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end
  end # DELETE /api/v1/tables/:id

  describe 'GET /api/v1/viz/:id/viz' do
    it 'renders vizjson v1' do
      table_attributes  = table_factory
      table_id          = table_attributes.fetch('id')
      get "/api/v1/viz/#{table_id}/viz?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
    end
  end # GET /api/v1/viz/:id/viz

  describe 'GET /api/v2/viz/:id/viz' do
    it 'renders vizjson v2' do
      table_attributes  = table_factory
      table_id          = table_attributes.fetch('id')
      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
    end
  end # GET /api/v2/viz/:id/viz

  def factory
    map = ::Map.create(user_id: @user.id)
    {
      name:         "visualization #{rand(9999)}",
      tags:         ['foo', 'bar'],
      map_id:       map.id,
      description:  'bogus',
      type:         'derived'
    }
  end #factory

  def table_factory
    payload = { name: "table #{rand(9999)}" }
    post "/api/v1/tables?api_key=#{@api_key}",
      payload.to_json, @headers

    table_attributes  = JSON.parse(last_response.body)
    table_id          = table_attributes.fetch('id')
    table_name        = table_attributes.fetch('name')

    put "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
      { privacy: 1 }.to_json, @headers

    sql = URI.escape(%Q{
      INSERT INTO #{table_name} (description)
      VALUES('bogus description')
    })

    get "/api/v1/queries?sql=#{sql}&api_key=#{@api_key}", {}, @headers
    table_attributes
  end #table_factory
end # Api::Json::VisualizationsController

