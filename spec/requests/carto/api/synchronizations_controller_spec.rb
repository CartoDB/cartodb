# encoding: utf-8

require 'sequel'
require 'rack/test'
require_relative '../../../spec_helper'
require_relative '../../api/json/synchronizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/synchronizations_controller'

describe Carto::Api::SynchronizationsController do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

  it_behaves_like 'synchronization controllers' do
  end

  describe 'main behaviour' do
    # INFO: this tests come from spec/requests/api/json/synchronizations_controller_spec.rb

    before(:all) do
      @old_resque_inline_status = Resque.inline
      Resque.inline = false
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
      Resque.inline = @old_resque_inline_status
      bypass_named_maps
      @user.destroy
    end

    describe 'GET /api/v1/synchronizations/:id' do
      it 'returns a synchronization record' do
        payload = {
          table_name: 'table_1',
          interval:   3600,
          url:        'http://www.foo.com'
        }

        post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get "/api/v1/synchronizations/#{id}?api_key=#{@api_key}", nil, @headers
        last_response.status.should == 200

        response = JSON.parse(last_response.body)
        response.fetch('id').should == id
        response.fetch('url').should == payload.fetch(:url)
      end

      it 'returns 404 for unknown synchronizations' do
        get "/api/v1/synchronizations/56b40691-541b-4ef3-96da-f2be29563566?api_key=#{@api_key}", nil, @headers
        last_response.status.should == 404
      end
    end

    describe 'GET /api/v1/synchronizations/:id/sync_now' do
      it 'returns sync status' do
        payload = {
          table_name: 'table_1',
          interval:   3600,
          url:        'http://www.foo.com'
        }

        post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get "/api/v1/synchronizations/#{id}/sync_now?api_key=#{@api_key}", nil, @headers
        last_response.status.should == 200

        response = JSON.parse(last_response.body)
        response.fetch('state').should == 'queued'
      end
    end

    describe 'GET /api/v1/synchronizations/' do
      it 'returns sync list' do
        get "/api/v1/synchronizations?api_key=#{@api_key}", nil, @headers
        last_response.status.should == 200
      end
    end
  end

end
