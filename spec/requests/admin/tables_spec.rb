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
    @api_key = $user_1.api_key
    $user_1.stubs(:should_load_common_data?).returns(false)
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @db = Rails::Sequel.connection
    delete_user_data $user_1
    @headers = {
      'CONTENT_TYPE'  => 'application/json',
    }
    host! "#{$user_1.username}.localhost.lan"
  end

  after(:all) do
    $user_1.destroy
    delete_user_data($user_1)
  end

  describe 'GET /dashboard' do
    it 'returns a list of tables' do
      login_as($user_1, scope: $user_1.username)

      get "/dashboard", {}, @headers
      last_response.status.should == 200
    end
  end # GET /tables

  describe 'GET /tables/:id' do
    it 'returns a table' do
      id = factory.id
      login_as($user_1, scope: $user_1.username)

      get "/tables/#{id}", {}, @headers
      last_response.status.should == 200
    end
  end # GET /tables/:id

  def factory
    new_table(user_id: $user_1.id).save.reload
  end #table_attributes

end # Admin::TablesController

