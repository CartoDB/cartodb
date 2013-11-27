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
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @user = create_user(
      username: 'test',
      email:    'test@test.com',
      password: 'test'
    )
    @api_key = @user.api_key
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
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
  end #table_attributes
end # Admin::TablesController

