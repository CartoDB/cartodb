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
      sync_tables_enabled: true
    )
    @api_key = @user.api_key
  end

  before(:each) do
    @db = SequelRails.connection
    Sequel.extension(:pagination)

    CartoDB::Synchronization.repository = DataRepository::Backend::Sequel.new(@db, :synchronizations)

    bypass_named_maps
    delete_user_data @user
    @headers = {
      'CONTENT_TYPE' => 'application/json'
    }
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  describe 'POST /api/v1/synchronizations' do
    it 'creates a synchronization' do
      payload = {
        table_name: 'table_1',
        interval:   3600,
        url:        'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('id').should_not be_empty
      response.fetch('name').should_not be_empty
    end

    it 'respond error 400 if interval is beneath 15 minutes' do
      payload = {
        table_name: 'table_1',
        interval: 60,
        url: 'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, @headers
      last_response.status.should eq 400
      last_response.body.to_str.should match /15 minutes/
    end

    it 'schedules an import' do
      payload = {
        table_name: 'table_1',
        interval:   3600,
        url:        'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.fetch('data_import').should_not be_empty
    end

  end

end
