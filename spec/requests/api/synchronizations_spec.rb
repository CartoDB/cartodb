require 'spec_helper_unit'
require_relative '../../../app/controllers/api/json/synchronizations_controller'
require_relative '../../../services/data-repository/backend/sequel'

def app
  CartoDB::Application.new
end

describe Api::Json::SynchronizationsController do
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'HTTP_ACCEPT' => 'application/json'
    }
  end

  before do
    @user = create_user(sync_tables_enabled: true)
    @api_key = @user.api_key
    @db = SequelRails.connection
    Sequel.extension(:pagination)

    CartoDB::Synchronization.repository = DataRepository::Backend::Sequel.new(@db, :synchronizations)

    bypass_named_maps
    host! "#{@user.username}.localhost.lan"
  end

  describe 'POST /api/v1/synchronizations' do
    it 'creates a synchronization' do
      payload = {
        table_name: 'table_1',
        interval: 3600,
        url: 'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body.fetch('id').should_not be_empty
      response_body.fetch('name').should_not be_empty
    end

    it 'respond error 400 if interval is beneath 15 minutes' do
      payload = {
        table_name: 'table_1',
        interval: 60,
        url: 'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, headers

      response.status.should eq 400
      response.body.to_str.should match /15 minutes/
    end

    it 'schedules an import' do
      payload = {
        table_name: 'table_1',
        interval:   3600,
        url:        'http://www.foo.com'
      }

      post "/api/v1/synchronizations?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body.fetch('data_import').should_not be_empty
    end
  end
end
