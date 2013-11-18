# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../../app/controllers/api/json/overlays_controller'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../app/models/overlay/migrator'

def app
  CartoDB::Application.new
end #app

describe Api::Json::OverlaysController do
  include Rack::Test::Methods
  include DataRepository

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    "client@example.com",
      password: "clientex"
    )
    @user.set_map_key
    @api_key = @user.api_key
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
      "CONTENT_TYPE" => 'application/json',
      "HTTP_HOST" => "test.localhost.lan"
    }
  end

  describe 'POST /api/v1/viz/:visualization_id/overlays' do
    it 'creates an overlay for visualization' do
      base_url = base_url_for(rand(100))

      post "#{base_url}?api_key=#{@api_key}",
        sample_payload.to_json, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)

      response.fetch('id')      .should_not be_nil
      response.fetch('type')    .should == sample_payload.fetch(:type)

      get "#{base_url}/#{response.fetch('id')}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('type')    .should == sample_payload.fetch(:type)
    end
  end # POST /api/v1/viz/:visualization_id/overlays

  describe 'GET /api/v1/viz/:visualization_id/overlays/:id' do
    it 'returns an overlay from a visualization' do
      base_url, overlay_id = create_overlay
      get "#{base_url}/#{overlay_id}?api_key=#{@api_key}",
        {}, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)

      response.fetch('id')                .should_not be_nil
      response.fetch('type')              .should_not be_nil
      response.fetch('visualization_id')  .should_not be_nil
      response.has_key?('options')        .should == true
      response.has_key?('order')          .should == true
    end
  end # GET /api/v1/viz/:visualization_id/overlays/:id

  describe 'PUT /api/v1/viz/:visualization_id/overlays/:id' do
    it 'updates an existing visualization' do
      base_url, overlay_id = create_overlay

      put "#{base_url}/#{overlay_id}?api_key=#{@api_key}",
        { type: 'changed' }.to_json, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('type').should == 'changed'
    end
  end # PUT /api/v1/viz/:visualization_id/overlays/:id

  describe 'DELETE /api/v1/viz/:visualization_id/overlays/:id' do
    it 'deletes the visualization' do
      base_url, overlay_id = create_overlay

      delete "#{base_url}/#{overlay_id}?api_key=#{@api_key}",
        {}, @headers

      last_response.status.should == 204
      last_response.body.should be_empty

      get "#{base_url}/#{overlay_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end
  end # DELETE /api/v1/viz/:visualization_id/overlays/:id

  def sample_payload
    {
      type:       'zoom',
      order:      rand(10),
      options:    {
                    maxZoom: 1,
                    minZoom: 20
                  }
    }
  end #sample_payload

  def create_overlay
    base_url = base_url_for(rand(100))     

    post "#{base_url}?api_key=#{@api_key}",
      sample_payload.to_json, @headers
    last_response.status.should == 200

    overlay_id = JSON.parse(last_response.body).fetch('id')
    [base_url, overlay_id]
  end #base_url

  def base_url_for(visualization_id)
    "/api/v1/viz/#{visualization_id}/overlays"
  end #base_url
end # Api::Json::OverlaysController

