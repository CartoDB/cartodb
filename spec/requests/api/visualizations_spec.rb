require 'minitest/autorun'
require 'rack/test'
require 'json'
require_relative '../../../app/controllers/api/json/visualization'

def app
  CartoDB::Visualization::API.new
end #app

include CartoDB

describe Visualization::API do
  include Rack::Test::Methods
 
  before do
    Visualization.default_repository = DataRepository::Repository.new
  end

  describe 'GET /api/v1/visualizations' do
    it 'retrieves a collection of visualizations' do
      payload = factory
      post '/api/v1/visualizations', payload.to_json
      id = JSON.parse(last_response.body).fetch('id')
      
      get '/api/v1/visualizations'
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.first.fetch('id').must_equal id
    end

    it 'is updated after creating a visualization' do
      payload = factory
      post '/api/v1/visualizations', payload.to_json

      get '/api/v1/visualizations'
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.must_equal 1

      payload = factory.merge('name' => 'another one')
      post '/api/v1/visualizations', payload.to_json

      get '/api/v1/visualizations'
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.must_equal 2
    end

    it 'is updated after deleted a visualization' do
      payload = factory
      post '/api/v1/visualizations', payload.to_json
      id = JSON.parse(last_response.body).fetch('id')
      
      get '/api/v1/visualizations'
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.wont_be_empty

      delete "/api/v1/visualizations/#{id}"
      get '/api/v1/visualizations'

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.must_be_empty
    end
  end # GET /api/v1/visualizations

  describe 'POST /api/v1/visualizations' do
    it 'creates a visualization' do
      payload = factory
      post '/api/v1/visualizations', payload.to_json
      last_response.status.must_equal 201

      response = JSON.parse(last_response.body)

      response.fetch('name')        .must_equal 'new_visualization_1'
      response.fetch('tags')        .must_equal payload.fetch(:tags)
      response.fetch('map_id')      .must_equal payload.fetch(:map_id)
      response.fetch('description') .must_equal payload.fetch(:description)

      get "/api/v1/visualizations/#{response.fetch('id')}"
      last_response.status.must_equal 200

      response = JSON.parse(last_response.body)
      response.fetch('name')        .wont_be_nil
      response.fetch('tags')        .must_equal payload.fetch(:tags)
    end
  end # POST /api/v1/visualizations

  describe 'GET /api/v1/visualizations/:id' do
    it 'returns a visualization' do
      payload = factory
      post '/api/v1/visualizations', payload.to_json
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/visualizations/#{id}"
      last_response.status.must_equal 200

      response = JSON.parse(last_response.body)

      response.fetch('id')            .wont_be_nil
      response.fetch('map_id')        .wont_be_nil
      response.fetch('tags')          .wont_be_empty
      response.fetch('description')   .wont_be_nil
    end
  end # GET /api/v1/visualizations/:id

  describe 'PUT /api/v1/visualizations/:id' do
    it 'updates an existing visualization' do
      payload   = factory
      post '/api/v1/visualizations', payload.to_json

      response  =  JSON.parse(last_response.body)
      id        = response.fetch('id')
      tags      = response.fetch('tags')

      put "/api/v1/visualizations/#{id}", { name: 'changed' }.to_json
      last_response.status.must_equal 200
      response = JSON.parse(last_response.body)
      response.fetch('name').must_equal 'changed'
      response.fetch('tags').must_equal tags
    end
  end # PUT /api/v1/visualizations

  describe 'DELETE /api/v1/visualizations/:id' do
    it 'deletes the visualization' do
      payload   = factory
      post '/api/v1/visualizations', payload.to_json

      id = JSON.parse(last_response.body).fetch('id')
      get "/api/v1/visualizations/#{id}"
      last_response.status.must_equal 200

      delete "/api/v1/visualizations/#{id}"
      last_response.status.must_equal 204
      last_response.body.must_be_empty

      get "/api/v1/visualizations/#{id}"
      last_response.status.must_equal 404
    end
  end # DELETE /api/v1/visualizations/:id

  def factory
    {
      name:         'new visualization 1' ,
      tags:         ['foo', 'bar'],
      map_id:       rand(999),
      description:  'bogus',
      derived:      true
    }
  end #factory
end # Visualization::API

