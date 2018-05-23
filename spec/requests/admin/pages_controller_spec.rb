# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/controllers/admin/pages_controller'
require_relative '../../factories/organizations_contexts'
require_relative '../../factories/carto_visualizations'

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

  describe '#index' do
    before(:each) do
      host! "#{@org_name}.localhost.lan"
    end

    it 'returns 404 if user does not belongs to host organization' do
      user = prepare_user(@non_org_user_name)

      get "/u/#{@non_org_user_name}", {}, JSON_HEADER

      last_response.status.should == 404

      user.delete
    end

    it 'returns 200 if it is an org user and belongs to host organization' do
      user = prepare_user(@org_user_name, @user_org, @belongs_to_org)

      get "/u/#{@org_user_name}", {}, JSON_HEADER

      last_response.status.should == 200

      user.delete
    end

    it 'redirects_to dashboard if organization user is logged in' do
      user = prepare_user(@org_user_name, @user_org, @belongs_to_org)

      login_as(user, scope: user.username)

      get "/u/#{@org_user_name}", {}, JSON_HEADER

      last_response.status.should == 302

      follow_redirect!

      uri = URI.parse(last_request.url)
      uri.host.should == "#{@org_name}.localhost.lan"
      uri.path.should == "/u/#{@org_user_name}/dashboard"

      user.delete
    end

    it 'redirects if it is an org user but gets called without organization' do
      user = prepare_user(@org_user_name, @user_org, @belongs_to_org)

      host! "#{@org_user_name}.localhost.lan"
      get "", {}, JSON_HEADER

      last_response.status.should == 302
      follow_redirect!
      last_response.status.should == 200

      user.delete
    end

    it 'returns 404 if it is an org user but does NOT belong to host organization' do
      user = prepare_user(@other_org_user_name, @user_org, !@belongs_to_org)

      get "/u/#{@other_org_user_name}", {}, JSON_HEADER

      last_response.status.should == 404

      user.delete
    end

    it 'returns 404 if user does NOT exist' do
      get '/u/non-exitant-user', {}, JSON_HEADER

      last_response.status.should == 404
    end

    it 'redirects to user feed home if current user and current viewer are different' do
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
      uri.path.should == '/me'

      [anyuser, anyviewer].each(&:delete)
    end

    it 'redirects to user feed if not logged in' do
      user = prepare_user('anyuser')
      host! 'anyuser.localhost.lan'

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      uri = URI.parse(last_response.location)
      uri.host.should == 'anyuser.localhost.lan'
      uri.path.should == '/me'
      follow_redirect!
      last_response.status.should == 200

      user.delete
    end

    it 'redirects to local login page if no user is specified and Central is not enabled' do
      Cartodb.with_config(cartodb_central_api: {}) do
        user = prepare_user('anyuser')
        host! 'localhost.lan'
        CartoDB.stubs(:session_domain).returns('localhost.lan')
        CartoDB.stubs(:subdomainless_urls?).returns(true)

        get '', {}, JSON_HEADER

        last_response.status.should == 302
        uri = URI.parse(last_response.location)
        uri.host.should == 'localhost.lan'
        uri.path.should == '/login'
        follow_redirect!
        last_response.status.should == 200

        user.delete
      end
    end

    it 'redirects to Central login page if no user is specified and Central is enabled' do
      central_host = 'somewhere.lan'
      central_port = 4321
      Cartodb.with_config(
        cartodb_central_api: {
          'host' => central_host,
          'port' => central_port,
          'username' => 'api',
          'password' => 'test'
        }
      ) do
        user = prepare_user('anyuser')
        host! 'localhost.lan'
        CartoDB.stubs(:session_domain).returns('localhost.lan')
        CartoDB.stubs(:subdomainless_urls?).returns(true)

        get '', {}, JSON_HEADER

        last_response.status.should == 302
        uri = URI.parse(last_response.location)
        uri.host.should == 'localhost.lan'
        uri.path.should == '/login'
        follow_redirect!

        last_response.status.should == 302
        uri = URI.parse(last_response.location)
        uri.host.should == central_host
        uri.port.should == central_port
        uri.path.should == '/login'
        follow_redirect!

        user.delete
      end
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

      anyuser.delete
    end

    it 'extracts username from redirection for dashboard with subdomainless' do
      username = 'endedwithu'
      anyuser = prepare_user(username)
      host! 'localhost.lan'
      login_as(anyuser, scope: anyuser.username)
      CartoDB.stubs(:session_domain).returns('localhost.lan')
      CartoDB.stubs(:subdomainless_urls?).returns(true)

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      uri = URI.parse(last_response.location)
      uri.host.should == 'localhost.lan'
      uri.path.should == "/user/#{username}/dashboard"

      login_as(anyuser, scope: anyuser.username)
      location = last_response.location
      User.any_instance.stubs(:db_size_in_bytes).returns(0)
      get location
      last_response.status.should == 200

      anyuser.delete
    end

    it 'redirects to login without login' do
      host! 'localhost.lan'

      get '', {}, JSON_HEADER

      uri = URI.parse(last_response.location)
      uri.host.should == 'localhost.lan'
      uri.path.should == "/login"
    end
  end

  describe '#explore' do
    before(:each) do
      host! "#{@org_name}.localhost.lan"
    end

    it 'should go to explore page' do
      user = mock_explore_feature_flag
      host! 'localhost.lan'

      get '/explore', {}, JSON_HEADER

      last_response.status.should == 200
      uri = URI.parse(last_request.url)
      uri.host.should == 'localhost.lan'
      uri.path.should == '/explore'

      user.delete
    end

    it 'should go to explore search page' do
      user = mock_explore_feature_flag
      host! 'localhost.lan'

      get '/search', {}, JSON_HEADER

      last_response.status.should == 200
      uri = URI.parse(last_request.url)
      uri.host.should == 'localhost.lan'
      uri.path.should == '/search'

      user.delete
    end

    it 'should go to explore search page with a query variable' do
      user = mock_explore_feature_flag
      host! 'localhost.lan'

      get '/search/lala', {}, JSON_HEADER

      last_response.status.should == 200
      uri = URI.parse(last_request.url)
      uri.host.should == 'localhost.lan'
      uri.path.should == '/search/lala'

      user.delete
    end
  end

  describe '#sitemap' do
    include Carto::Factories::Visualizations
    it 'should return 404 if no user or organization is provided' do
      get '/sitemap.xml'
      last_response.status.should == 404
    end

    describe 'for organizations' do
      include_context 'organization with users helper'

      before(:each) do
        host! "#{@carto_organization.name}.localhost.lan:#{Cartodb.config[:http_port]}"
      end

      it 'returns an empty body if there are not visualizations' do
        get public_sitemap_url(user_domain: @carto_organization.name)
        document = Nokogiri::XML(last_response.body)
        document.child.child.text.should eq "\n"
      end

      it 'returns public visualizations' do
        private_attrs = { privacy: Carto::Visualization::PRIVACY_PRIVATE }
        create_full_visualization(@carto_org_user_1, visualization_attributes: private_attrs)
        public_attrs = { privacy: Carto::Visualization::PRIVACY_PUBLIC }
        _, _, _, visualization = create_full_visualization(@carto_org_user_1, visualization_attributes: public_attrs)
        get public_sitemap_url(user_domain: @carto_organization.name)
        last_response.status.should eq 200
        document = Nokogiri::XML(last_response.body)
        url_and_dates = document.search('url').map { |url| [url.at('loc').text, url.at('lastmod').text] }
        url_and_dates.count.should eq 1

        url1 = public_visualizations_public_map_url(user_domain: @carto_org_user_1.username, id: visualization.id)
        url_and_dates.map { |url_and_date| url_and_date[0] }.should eq [url1.gsub(/\/user\/[^\/]*\//, '/')]
      end
    end

    describe 'for users' do
      include_context 'users helper'

      before(:each) do
        host! "#{@carto_user1.username}.localhost.lan:#{Cartodb.config[:http_port]}"
      end

      it 'returns public visualizations' do
        private_attrs = { privacy: Carto::Visualization::PRIVACY_PRIVATE }
        create_full_visualization(@carto_user1, visualization_attributes: private_attrs)
        public_attrs = { privacy: Carto::Visualization::PRIVACY_PUBLIC }
        _, _, _, visualization = create_full_visualization(@carto_user1, visualization_attributes: public_attrs)
        get public_sitemap_url(user_domain: @carto_user1.username)
        last_response.status.should eq 200
        document = Nokogiri::XML(last_response.body)
        url_and_dates = document.search('url').map { |url| [url.at('loc').text, url.at('lastmod').text] }
        url_and_dates.count.should eq 1

        url1 = public_visualizations_public_map_url(id: visualization.id)
        url_and_dates.map { |url_and_date| url_and_date[0] }.should eq [url1.gsub(/\/user\/[^\/]*\//, '/')]
      end
    end
  end

  def mock_explore_feature_flag
    anyuser = prepare_user('anyuser')
    ::User.any_instance.stubs(:has_feature_flag?)
                          .with('explore_site')
                          .returns(true)
    ::User.stubs(:where).returns(anyuser)
    anyuser.stubs(:first).returns(anyuser)
    anyuser
  end

  def prepare_user(user_name, org_user=false, belongs_to_org=false)
    user = create_user(
      username: user_name,
      email:    "#{user_name}@example.com",
      password: 'longer_than_MIN_PASSWORD_LENGTH',
      fake_user: true,
      quota_in_bytes: 10000000
    )

    user.stubs(:username => user_name, :organization_user? => org_user)

    if org_user
      org = mock
      org.stubs(name: @org_name)
      org.stubs(password_expiration_in_d: nil)
      user.stubs(organization: org)
      Organization.stubs(:where).with(name: @org_name).returns([org])
      Organization.stubs(:where).with(name: @org_user_name).returns([org])
      ::User.any_instance.stubs(:belongs_to_organization?).with(org).returns(belongs_to_org)
    end

    user
  end

end
