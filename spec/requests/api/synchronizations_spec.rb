# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require 'uri'

require_relative '../../spec_helper'
require_relative '../../../app/controllers/api/json/synchronizations_controller'
require_relative '../../../services/data-repository/backend/sequel'

include CartoDB

def app
  CartoDB::Application.new
end

describe Api::Json::SynchronizationsController do
  include Rack::Test::Methods

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex'
    )
    @user.set_map_key
    @api_key = @user.api_key
  end

  before(:each) do
    @db = Rails::Sequel.connection
    Sequel.extension(:pagination)

    CartoDB::Synchronization.repository  = 
      DataRepository::Backend::Sequel.new(@db, :synchronizations)

    delete_user_data @user
    @headers = {
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'POST /api/v1/synchronizations' do
    it 'creates a synchronization' do
      payload = {
        table_name: 'table_1',
        interval:   500,
        url:        'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}",
        payload.to_json, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('id').should_not be_empty
      response.fetch('name').should_not be_empty
    end

    it 'makes the related table unmodifiable' do
    end

    it 'schedules an import' do
      payload = {
        table_name: 'table_1',
        interval:   500,
        url:        'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}",
        payload.to_json, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('links').fetch('data_import').should_not be_empty
    end

    it 'returns 401 unless user has an appropriate plan' do
    end
  end

  describe 'GET /api/v1/synchronizations' do
    it 'returns a synchronization record' do
      payload = {
        table_name: 'table_1',
        interval:   500,
        url:        'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')

      get "/api/v1/synchronizations/#{id}?api_key=#{@api_key}",
        nil, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('id').should == id
      response.fetch('url').should == payload.fetch(:url)
    end
  end

  describe 'PUT /api/v1/synchronizations' do
    it 'updates a synchronization' do
    end

    it 'makes the table modifiable if synchronization disabled' do
    end

    it 'makes the table unmodifiable if synchronization enabled' do
    end

    it 'returns 401 unless user has an appropriate plan' do
    end
  end

  describe 'DELETE /api/v1/synchronizations' do
    it 'deletes a synchronization' do
    end

    it 'makes the related table modifiable' do
    end

    it 'returns 401 unless user has an appropriate plan' do
    end
  end
end
