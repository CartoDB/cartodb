# encoding: utf-8
require 'minitest/autorun'
require 'rack/test'
require 'json'
require_relative '../../../app/controllers/api/json/overlay'
require_relative '../../../services/data-repository/backend/sequel'

include CartoDB
include DataRepository

def app
  Overlay::API.new
end #app

describe Overlay::API do
  include Rack::Test::Methods
  
  before do
    Sequel.extension(:pagination)
    db = Sequel.sqlite

    db.create_table :overlays do
      String    :id,                null: false, primary_key: true
      Integer   :order,             null: false
      String    :options,           text: true
      String    :type,              text: true
      String    :visualization_id,  index: true
    end

    Overlay.repository = DataRepository::Backend::Sequel.new(db, :overlays)
  end

  describe 'POST /api/v1/visualizations/:visualization_id/overlays' do
    it 'creates an overlay for visualization' do
      base_url = base_url_for(rand(100))

      post base_url, sample_payload.to_json
      last_response.status.must_equal 201

      response = JSON.parse(last_response.body)

      response.fetch('id')      .wont_be_nil
      response.fetch('type')    .must_equal sample_payload.fetch(:type)

      get "#{base_url}/#{response.fetch('id')}"
      last_response.status.must_equal 200

      response = JSON.parse(last_response.body)
      response.fetch('type')    .must_equal sample_payload.fetch(:type)
    end
  end # POST /api/v1/visualizations/:visualization_id/overlays

  describe 'GET /api/v1/visualizations/:visualization_id/overlays/:id' do
    it 'returns an overlay from a visualization' do
      base_url, overlay_id = create_overlay
      get "#{base_url}/#{overlay_id}"

      last_response.status.must_equal 200
      response = JSON.parse(last_response.body)

      response.fetch('id')                .wont_be_nil
      response.fetch('type')              .wont_be_nil
      response.fetch('visualization_id')  .wont_be_nil
      response.has_key?('options')        .must_equal true
      response.has_key?('order')          .must_equal true
    end
  end # GET /api/v1/visualizations/:visualization_id/overlays/:id

  describe 'PUT /api/v1/visualizations/:visualization_id/overlays/:id' do
    it 'updates an existing visualization' do
      base_url, overlay_id = create_overlay

      put "#{base_url}/#{overlay_id}", { type: 'changed' }.to_json
      last_response.status.must_equal 200

      response = JSON.parse(last_response.body)
      response.fetch('type').must_equal 'changed'
    end
  end # PUT /api/v1/visualizations/:visualization_id/overlays/:id

  describe 'DELETE /api/v1/visualizations/:visualization_id/overlays/:id' do
    it 'deletes the visualization' do
      base_url, overlay_id = create_overlay

      delete "#{base_url}/#{overlay_id}"
      last_response.status.must_equal 204
      last_response.body.must_be_empty

      get "#{base_url}/#{overlay_id}"
      last_response.status.must_equal 404
    end
  end # DELETE /api/v1/visualizations/:visualization_id/overlays/:id

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

    post base_url, sample_payload.to_json
    last_response.status.must_equal 201

    overlay_id = JSON.parse(last_response.body).fetch('id')
    [base_url, overlay_id]
  end #base_url

  def base_url_for(visualization_id)
    "/api/v1/visualizations/#{visualization_id}/overlays"
  end #base_url
end # Overlay::API

