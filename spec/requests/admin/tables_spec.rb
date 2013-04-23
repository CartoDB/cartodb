# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'

def app
  CartoDB::Application.new
end #app

describe Admin::TablesController do
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'test@test.com',
      password: 'test'
    )
    @user.set_map_key
    @api_key = @user.get_map_key
  end

  before(:each) do
    @db = Sequel.sqlite
    delete_user_data @user
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'GET /dashboard' do
    it 'returns a list of tables' do
      login_as(@user, scope: 'test')

      get "/dashboard", {}, @headers
      last_response.status.should == 200
    end
  end # GET /tables

  describe 'GET /tables/:id' do
    it 'returns a table' do
      id = factory.fetch('id')
      login_as(@user, scope: 'test')

      get "/tables/#{id}", {}, @headers
      last_response.status.should == 200
    end
  end # GET /tables/:id

  describe 'GET /tables/:id/public' do
    it 'returns public data for a table' do
      id = factory.fetch('id')

      get "/tables/#{id}/public", {}, @headers
      last_response.status.should == 200
    end
  end # GET /tables/:id/public

  def factory
    payload = {
      name:         "table #{rand(9999)}",
    }
    post "/api/v1/tables?api_key=#{@api_key}",
      payload.to_json, @headers

    factory =  JSON.parse(last_response.body)
    id = factory.fetch('id')

    put "/api/v1/tables/#{id}?api_key=#{@api_key}",
      { privacy: 1 }.to_json, @headers

    sql = URI.escape(%Q{
      INSERT INTO #{factory.fetch('name')} (description)
      VALUES('bogus description')
    })

    get "/api/v1/queries?sql=#{sql}&api_key=#{@api_key}", {}, @headers
    factory
  end #factory
end # Admin::TablesController

