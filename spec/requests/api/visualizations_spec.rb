# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../../app/controllers/api/json/visualizations_controller'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/migrator'

include CartoDB
include DataRepository

def app
  CartoDB::Application.new
end #app

describe Api::Json::VisualizationsController do
  include Rack::Test::Methods

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex'
    )
    @user.set_map_key
    Sequel.extension(:pagination)
    @api_key = @user.get_map_key
  end

  before(:each) do
    @db = Sequel.sqlite
    Visualization::Migrator.new(@db).migrate
    delete_user_data @user
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'POST /api/v1/visualizations' do
    it 'creates a visualization' do
      payload = factory

      post "/api/v1/visualizations?api_key=#{@api_key}",
            payload.to_json, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)

      response.fetch('name')        .should =~ /visualization/
      response.fetch('tags')        .should == payload.fetch(:tags)
      response.fetch('map_id')      .should == payload.fetch(:map_id)
      response.fetch('description') .should == payload.fetch(:description)
      id = response.fetch('id')

      get "/api/v1/visualizations/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should ==  200

      response = JSON.parse(last_response.body)
      response.fetch('name')        .should_not == nil
      response.fetch('tags')        .should_not == payload.fetch(:tags).to_json
    end
  end # POST /api/v1/visualizations

  describe 'GET /api/v1/visualizations' do
    it 'retrieves a collection of visualizations' do
      payload = factory
      post "/api/v1/visualizations?api_key=#{@api_key}", 
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/visualizations?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.first.fetch('id').should == id
    end

    it 'is updated after creating a visualization' do
      payload = factory
      post "/api/v1/visualizations?api_key=#{@api_key}", 
        payload.to_json, @headers

      get "/api/v1/visualizations?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 1

      payload = factory.merge('name' => 'another one')
      post "/api/v1/visualizations?api_key=#{@api_key}",
        payload.to_json, @headers

      get "/api/v1/visualizations?api_key=#{@api_key}",
        {}, @headers
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 2
    end

    it 'is updated after deleting a visualization' do
      payload = factory
      post "/api/v1/visualizations?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/visualizations?api_key=#{@api_key}",
        {}, @headers
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should_not be_empty

      delete "/api/v1/visualizations/#{id}?api_key=#{@api_key}",
        {}, @headers
      get "/api/v1/visualizations?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should be_empty
    end

    it 'paginates results' do
      per_page = 10

      20.times do 
        post "/api/v1/visualizations?api_key=#{@api_key}",
          factory.to_json, @headers
      end

      get "/api/v1/visualizations?api_key=#{@api_key}&page=1&per_page=#{per_page}", {}, @headers

      last_response.status.should == 200
      
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should == per_page
    end

    it 'returns filtered results' do
      post "/api/v1/visualizations?api_key=#{@api_key}",
        factory.to_json, @headers

      get "/api/v1/visualizations?api_key=#{@api_key}&type=table",
        {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should be_empty

      post "/api/v1/visualizations?api_key=#{@api_key}",
        factory.to_json, @headers
      post "/api/v1/visualizations?api_key=#{@api_key}",
        factory.merge(type: 'table').to_json, @headers
      get "/api/v1/visualizations?api_key=#{@api_key}&type=derived",
        {}, @headers

      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 2
    end
  end # GET /api/v1/visualizations

  describe 'GET /api/v1/visualizations/:id' do
    it 'returns a visualization' do
      payload = factory
      post "/api/v1/visualizations?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/visualizations/#{id}?api_key=#{@api_key}", 
        {}, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)

      response.fetch('id')            .should_not be_nil
      response.fetch('map_id')        .should_not be_nil
      response.fetch('tags')          .should_not be_empty
      response.fetch('description')   .should_not be_nil

      get "/api/v1/visualizations/#{id}/map?api_key=#{@api_key}", 
        {}, @headers
      last_response.status.should == 204

      get "/api/v1/visualizations/#{id}/table?api_key=#{@api_key}", 
        {}, @headers
      last_response.status.should == 204
    end
  end # GET /api/v1/visualizations/:id

  describe 'PUT /api/v1/visualizations/:id' do
    it 'updates an existing visualization' do
      payload   = factory
      post "/api/v1/visualizations?api_key=#{@api_key}",
        payload.to_json, @headers

      response  =  JSON.parse(last_response.body)
      id        = response.fetch('id')
      tags      = response.fetch('tags')

      response.fetch('tags').should == ['foo', 'bar']

      put "/api/v1/visualizations/#{id}?api_key=#{@api_key}",
        { name: 'changed', tags: [] }.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('name').should == 'changed'
      response.fetch('tags').should == []
    end
  end # PUT /api/v1/visualizations

  describe 'DELETE /api/v1/visualizations/:id' do
    it 'deletes the visualization' do
      payload   = factory
      post "/api/v1/visualizations?api_key=#{@api_key}",
        payload.to_json, @headers

      id = JSON.parse(last_response.body).fetch('id')
      get "/api/v1/visualizations/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      delete "/api/v1/visualizations/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 204
      last_response.body.should be_empty

      get "/api/v1/visualizations/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end
  end # DELETE /api/v1/visualizations/:id

  def factory
    map = Map.create(user_id: @user.id)
    {
      name:         "visualization #{rand(9999)}",
      tags:         ['foo', 'bar'],
      map_id:       map.id,
      description:  'bogus',
      type:         'derived'
    }
  end #factory
end # Api::Json::VisualizationsController

