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
      password: 'test12'
    )
    @api_key = @user.api_key
    @user.stubs(:should_load_common_data?).returns(false)
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @db = Rails::Sequel.connection
    delete_user_data @user
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
    }
    host! 'test.localhost.lan'
  end

  after(:all) do
    @user.destroy
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
      id = factory.id
      login_as(@user, scope: 'test')

      get "/tables/#{id}", {}, @headers
      last_response.status.should == 200
    end
  end # GET /tables/:id

  def factory
    new_table(user_id: @user.id).save.reload
  end #table_attributes

end # Admin::TablesController

