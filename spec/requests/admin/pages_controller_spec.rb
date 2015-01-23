# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/controllers/admin/pages_controller'

def app
  CartoDB::Application.new
end #app

describe Admin::PagesController do
  include Rack::Test::Methods

  before(:all) do

    @non_org_user_name = 'development'

    @org_name = 'foobar'
    @org_user_name = 'foo'

    @other_org_user_name = 'other'

    @belongs_to_org = true
    @user_org = true
  end

  describe 'GET /u/foo' do
    it 'returns 404 if user does not belongs to host organization' do
      prepare_user(@non_org_user_name)

      get "/u/#{@non_org_user_name}", {}, org_host_headers

      last_response.status.should == 404
    end

    it 'returns 200 if it is an org user and belongs to host organization' do
      prepare_user(@org_user_name, @user_org, @belongs_to_org)

      get "/u/#{@org_user_name}", {}, org_host_headers

      last_response.status.should == 200
    end

    it 'returns 200 if it is an org user but gets called without organization' do
      prepare_user(@org_user_name, @user_org, @belongs_to_org)

      get "", {}, {
          'CONTENT_TYPE' => 'application/json',
          'HTTP_HOST' => "#{@org_user_name}.localhost.lan"
      }

      last_response.status.should == 200
    end

    it 'returns 404 if it is an org user but does NOT belong to host organization' do
      prepare_user(@other_org_user_name, @user_org, !@belongs_to_org)

      get "/u/#{@other_org_user_name}", {}, org_host_headers

      last_response.status.should == 404
    end

    it 'returns 404 if user does NOT exist' do
      get '/u/non-exitant-user', {}, org_host_headers

      last_response.status.should == 404
    end
  end

  def prepare_user(user_name, org_user=false, belongs_to_org=false)
    @user = create_user(
      username: user_name,
      email:    "#{user_name}@example.com",
      password: 'test',
      fake_user: true
    )

    User.any_instance.stubs(:username => user_name, :organization_user? => org_user)

    if org_user
      org = mock
      org.stubs(:eql?).returns(belongs_to_org)
      User.any_instance.stubs(:organization).returns(org)
    end
  end

  def org_host_headers
    {
      'CONTENT_TYPE' => 'application/json',
      'HTTP_HOST' => "#{@org_name}.localhost.lan"
    }
  end

end
