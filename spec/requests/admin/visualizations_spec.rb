# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../app/controllers/admin/visualizations_controller'

include CartoDB
include DataRepository

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

  describe 'GET /viz' do
    it 'returns a list of visualizations' do
      login_as(@user, scope: 'test')

      get "/viz", {}, @headers
      last_response.status.should == 200
    end
  end # GET /viz

  describe 'GET /viz:id' do
    it 'returns a visualization' do
      id = factory.fetch('id')
      login_as(@user, scope: 'test')

      get "/viz/#{id}", {}, @headers
      last_response.status.should == 200
    end
  end # GET /viz/:id

  describe 'GET /viz/:id/public' do
    it 'returns public data for a visualization' do
      id = factory.fetch('id')

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 200
    end
  end # GET /viz/:id/public

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
end # Admin::VisualizationsController

