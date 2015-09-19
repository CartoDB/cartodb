# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/controllers/admin/pages_controller'

def app
  CartoDB::Application.new
end #app

describe Admin::PagesController do
  include Rack::Test::Methods
  include Warden::Test::Helpers

  JSON_HEADER = {'CONTENT_TYPE' => 'application/json'}

  before(:all) do

    @non_org_user_name = 'development'

    @org_name = 'foobar'
    @org_user_name = 'foo'

    @other_org_user_name = 'other'

    @belongs_to_org = true
    @user_org = true
  end

  before(:each) do
    host! "#{@org_name}.localhost.lan"
  end

  after(:each) do
    User.all.each do |u|
      # Don't do destroy because the user don't have a db created
      u.user_notifications.each(&:destroy)
      u.delete
    end
  end

  describe '#index' do
    it 'returns 404 if user does not belongs to host organization' do
      prepare_user(@non_org_user_name)

      get "/u/#{@non_org_user_name}", {}, JSON_HEADER

      last_response.status.should == 404
    end

    it 'returns 200 if it is an org user and belongs to host organization' do
      prepare_user(@org_user_name, @user_org, @belongs_to_org)

      get "/u/#{@org_user_name}", {}, JSON_HEADER

      last_response.status.should == 200
    end

    it 'redirects if it is an org user but gets called without organization' do
      prepare_user(@org_user_name, @user_org, @belongs_to_org)

      host! "#{@org_user_name}.localhost.lan"
      get "", {}, JSON_HEADER

      last_response.status.should == 302
      follow_redirect!
      last_response.status.should == 200
    end

    it 'returns 404 if it is an org user but does NOT belong to host organization' do
      prepare_user(@other_org_user_name, @user_org, !@belongs_to_org)

      get "/u/#{@other_org_user_name}", {}, JSON_HEADER

      last_response.status.should == 404
    end

    it 'returns 404 if user does NOT exist' do
      get '/u/non-exitant-user', {}, JSON_HEADER

      last_response.status.should == 404
    end

    it 'redirects to public maps home if current user and current viewer are different' do
      anyuser = prepare_user('anyuser')
      anyviewer = prepare_user('anyviewer')
      login_as(anyviewer, scope: anyviewer.username)
      host! "#{anyuser.username}.localhost.lan"

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      follow_redirect!
      last_response.status.should == 200
      uri = URI.parse(last_request.url)
      uri.host.should == 'anyuser.localhost.lan'
      uri.path.should == '/maps'
    end

    it 'redirects to public maps home if not logged in' do
      anyuser = prepare_user('anyuser')
      host! 'anyuser.localhost.lan'

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      uri = URI.parse(last_response.location)
      uri.host.should == 'anyuser.localhost.lan'
      uri.path.should == '/maps'
      follow_redirect!
      last_response.status.should == 200
    end

    it 'redirects to login page if no user is especified' do
      anyuser = prepare_user('anyuser')
      host! 'localhost.lan'
      CartoDB.stubs(:subdomainless_urls?).returns(true)

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      uri = URI.parse(last_response.location)
      uri.host.should == 'localhost.lan'
      uri.path.should == '/login'
      follow_redirect!
      last_response.status.should == 200
    end

    it 'redirects and loads the dashboard if the user is logged in' do
      anyuser = prepare_user('anyuser')
      host! 'localhost.lan'
      login_as(anyuser, scope: anyuser.username)
      CartoDB.stubs(:session_domain).returns('localhost.lan')
      CartoDB.stubs(:subdomainless_urls?).returns(true)

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      uri = URI.parse(last_response.location)
      uri.host.should == 'localhost.lan'
      uri.path.should == '/user/anyuser/dashboard'
    end

  end

  def prepare_user(user_name, org_user=false, belongs_to_org=false)
    user = create_user(
      username: user_name,
      email:    "#{user_name}@example.com",
      password: 'longer_than_MIN_PASSWORD_LENGTH',
      fake_user: true
    )

    user.stubs(:username => user_name, :organization_user? => org_user)

    if org_user
      org = mock
      Organization.stubs(:where).with(name: @org_name).returns([org])
      User.any_instance.stubs(:belongs_to_organization?).with(org).returns(belongs_to_org)
    end

    user
  end

end
