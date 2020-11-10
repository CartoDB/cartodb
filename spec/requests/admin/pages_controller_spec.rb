require_relative '../../spec_helper'
require_relative '../../../app/controllers/admin/pages_controller'
require_relative '../../factories/organizations_contexts'
require_relative '../../factories/carto_visualizations'

describe Admin::PagesController do
  include Rack::Test::Methods
  include Warden::Test::Helpers

  JSON_HEADER = {'CONTENT_TYPE' => 'application/json'}

  let(:non_org_user_name) { 'development' }
  let(:org_user_name) { 'foo' }
  let(:other_org_user_name) { 'other' }
  let(:belongs_to_org) { true }
  let(:user_org) { true }
  let(:organization) { create_organization_with_users(password_expiration_in_d: nil) }

  describe '#index' do
    before { host!("#{organization.name}.localhost.lan") }
    after { Carto::User.delete_all }

    it 'returns 404 if user does not belongs to host organization' do
      prepare_user(non_org_user_name)

      get "/u/#{non_org_user_name}", {}, JSON_HEADER

      last_response.status.should == 404
    end

    it 'returns 200 if it is an org user and belongs to host organization' do
      prepare_user(org_user_name, user_org, belongs_to_org)

      get "/u/#{org_user_name}", {}, JSON_HEADER

      last_response.status.should == 200
    end

    it 'redirects_to dashboard if organization user is logged in' do
      user = prepare_user(org_user_name, user_org, belongs_to_org)

      login_as(user, scope: user.username)

      get "/u/#{org_user_name}", {}, JSON_HEADER

      expect(last_response.status).to eq(302)
      expect(last_response.location).to match(%r{
        http://#{organization.name}.localhost.lan.*/u/#{org_user_name}/dashboard
      }x)
    end

    it 'redirects if it is an org user but gets called without organization' do
      prepare_user(org_user_name, user_org, belongs_to_org)

      host! "#{org_user_name}.localhost.lan"
      get '', {}, JSON_HEADER

      expect(last_response.status).to eq(302)
      expect(last_response.location).to match(%r{http://#{org_user_name}.*/me})

      follow_redirect!

      expect(last_response.status).to eq(302)
      expect(last_response.location).to match(%r{http://#{organization.name}.*/u/#{org_user_name}/me})

      follow_redirect!

      expect(last_response.status).to eq(200)
    end

    it 'returns 404 if it is an org user but does NOT belong to host organization' do
      prepare_user(other_org_user_name, user_org, !belongs_to_org)

      get "/u/#{other_org_user_name}", {}, JSON_HEADER

      last_response.status.should == 404
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
    end

    it 'redirects to user feed if not logged in' do
      prepare_user('anyuser')
      host! 'anyuser.localhost.lan'

      get '', {}, JSON_HEADER

      last_response.status.should == 302
      uri = URI.parse(last_response.location)
      uri.host.should == 'anyuser.localhost.lan'
      uri.path.should == '/me'
      follow_redirect!
      last_response.status.should == 200
    end

    it 'redirects to local login page if no user is specified and Central is not enabled' do
      Cartodb.with_config(cartodb_central_api: {}) do
        prepare_user('anyuser')
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
        prepare_user('anyuser')
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
    end

    it 'extracts username from redirection for dashboard with subdomainless' do
      # we use this to avoid generating the static assets in CI
      Admin::VisualizationsController.any_instance.stubs(:render).returns('')

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
    end

    it 'redirects to login without login' do
      host! 'localhost.lan'

      get '', {}, JSON_HEADER

      uri = URI.parse(last_response.location)
      uri.host.should == 'localhost.lan'
      uri.path.should == "/login"
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

      it 'returns public and published visualizations' do
        private_attrs = { privacy: Carto::Visualization::PRIVACY_PRIVATE }
        create_full_visualization(@carto_org_user_1, visualization_attributes: private_attrs)
        unpublished_attrs = { privacy: Carto::Visualization::PRIVACY_PUBLIC, version: 3 }
        create_full_visualization(@carto_org_user_1, visualization_attributes: unpublished_attrs)
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

      it 'returns public and published visualizations' do
        private_attrs = { privacy: Carto::Visualization::PRIVACY_PRIVATE }
        create_full_visualization(@carto_user1, visualization_attributes: private_attrs)
        unpublished_attrs = { privacy: Carto::Visualization::PRIVACY_PUBLIC, version: 3 }
        create_full_visualization(@carto_user1, visualization_attributes: unpublished_attrs)
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

  describe '#datasets' do
    include_context 'users helper'

    before(:each) do
      host! "#{@carto_user1.username}.localhost.lan:#{Cartodb.config[:http_port]}"
      Carto::Visualization.find_each(&:destroy)
    end

    it 'returns 200 if a dataset has no table' do
      FactoryGirl.create(:table_visualization, user_id: @carto_user1.id, privacy: Carto::Visualization::PRIVACY_PUBLIC)
      Carto::Visualization.count.should eql 1
      visualization = Carto::Visualization.first
      visualization.table.should be_nil

      get public_datasets_home_url(user_domain: @carto_user1.username)

      last_response.status.should == 200
      last_response.body.should =~ /doesn\'t have any items/
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

  def prepare_user(username, organization_user = false, belongs_to_organization = false)
    user = if organization_user && belongs_to_organization
             organization.users.where.not(id: organization.owner.id).first
           elsif organization_user
             create_organization_with_users.owner
           else
             create(:valid_user).carto_user
           end

    user.update!(username: username, quota_in_bytes: 10_000_000)
    user
  end
end
