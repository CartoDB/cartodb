require_relative '../spec_helper'
require_relative '../helpers/subdomainless_helper'

require 'fake_net_ldap'
require_relative '../lib/fake_net_ldap_bind_as'

describe SessionsController do
  shared_examples_for 'LDAP' do
    it "doesn't allows to login until admin does first" do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      normal_user_username = "ldap-user"
      normal_user_password = "2{Patrañas}"
      normal_user_email = "ldap-user@test.com"
      normal_user_cn = "cn=#{normal_user_username},#{@domain_bases.first}"
      ldap_entry_data = {
        :dn => normal_user_cn,
        @user_id_field => [normal_user_username],
        @user_email_field => [normal_user_email]
      }
      FakeNetLdap.register_user(username: normal_user_cn, password: normal_user_password)
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', normal_user_username), [ldap_entry_data])

      errors = {
        errors: {
          organization: ["Organization owner is not set. Administrator must login first."]
        }
      }
      ::CartoDB.expects(:notify_debug).with('User not valid at signup', errors).returns(nil)

      post create_session_url(user_domain: user_domain, email: normal_user_username, password: normal_user_password)

      response.status.should == 200
      (response.body =~ /Signup issues/).to_i.should_not eq 0
    end

    it "Allows to login and triggers creation if using the org admin account" do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      # @See lib/user_account_creator.rb -> promote_to_organization_owner?
      admin_user_username = "#{@organization.name}-admin"
      admin_user_password = '2{Patrañas}'
      admin_user_email = "#{@organization.name}-admin@test.com"
      admin_user_cn = "cn=#{admin_user_username},#{@domain_bases.first}"
      ldap_entry_data = {
        :dn => admin_user_cn,
        @user_id_field => [admin_user_username],
        @user_email_field => [admin_user_email]
      }
      FakeNetLdap.register_user(username: admin_user_cn, password: admin_user_password)
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', admin_user_username), [ldap_entry_data])

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(TrueClass)).returns(true)

      post create_session_url(user_domain: user_domain, email: admin_user_username, password: admin_user_password)

      response.status.should == 200
      (response.body =~ /Your account is being created/).to_i.should_not eq 0
    end

    it "Allows to login and triggers creation of normal users if admin already present" do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      admin_user_username = "#{@organization.name}-admin"
      admin_user_password = '2{Patrañas}'
      admin_user_email = "#{@organization.name}-admin@test.com"
      @admin_user = create_user(
        username: admin_user_username,
        email: admin_user_email,
        password: admin_user_password,
        private_tables_enabled: true,
        quota_in_bytes: 12345,
        organization: nil
      )
      @admin_user.save.reload

      # INFO: Hack to avoid having to destroy and recreate later the organization
      ::Organization.any_instance.stubs(:owner).returns(@admin_user)

      normal_user_username = "ldap-user"
      normal_user_password = "foobar"
      normal_user_email = "ldap-user@test.com"
      normal_user_cn = "cn=#{normal_user_username},#{@domain_bases.first}"
      ldap_entry_data = {
        :dn => normal_user_cn,
        @user_id_field => [normal_user_username],
        @user_email_field => [normal_user_email]
      }
      FakeNetLdap.register_user(username: normal_user_cn, password: normal_user_password)
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', normal_user_username), [ldap_entry_data])

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)

      post create_session_url(user_domain: user_domain, email: normal_user_username, password: normal_user_password)

      response.status.should == 200
      (response.body =~ /Your account is being created/).to_i.should_not eq 0

      @admin_user.destroy
    end

    it "Just logs in if finds a cartodb username that matches with LDAP credentials " do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      admin_user_username = "#{@organization.name}-admin"
      admin_user_password = '2{Patrañas}'
      admin_user_email = "#{@organization.name}-admin@test.com"
      admin_user_cn = "cn=#{admin_user_username},#{@domain_bases.first}"
      ldap_entry_data = {
        :dn => admin_user_cn,
        @user_id_field => [admin_user_username],
        @user_email_field => [admin_user_email]
      }
      FakeNetLdap.register_user(username: admin_user_cn, password: admin_user_password)
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', admin_user_username), [ldap_entry_data])

      @admin_user = create_user(
        username: admin_user_username,
        email: admin_user_email,
        password: admin_user_password,
        private_tables_enabled: true,
        quota_in_bytes: 12345,
        organization: nil
      )
      @admin_user.save.reload
      ::Organization.any_instance.stubs(:owner).returns(@admin_user)

      # INFO: Again, hack to act as if user had organization
      ::User.stubs(:where).with(username: admin_user_username,
                                organization_id: @organization.id).returns([@admin_user])

      post create_session_url(user_domain: user_domain, email: admin_user_username, password: admin_user_password)

      response.status.should == 302
      (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/dashboard\/$/).to_i.should eq 0

      ::User.unstub(:where)

      @admin_user.destroy
    end

    it "Falls back to credentials if user is not present at LDAP" do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      admin_user_username = "#{@organization.name}-admin"
      admin_user_password = '2{Patrañas}'
      admin_user_email = "#{@organization.name}-admin@test.com"
      admin_user_cn = "cn=#{admin_user_username},#{@domain_bases.first}"
      ldap_entry_data = {
        :dn => admin_user_cn,
        @user_id_field => [admin_user_username],
        @user_email_field => [admin_user_email]
      }
      FakeNetLdap.register_user(username: admin_user_cn, password: 'fake')
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', admin_user_username), [ldap_entry_data])

      @admin_user = create_user(
        username: admin_user_username,
        email: admin_user_email,
        password: admin_user_password,
        private_tables_enabled: true,
        quota_in_bytes: 12345,
        organization: nil
      )
      @admin_user.save.reload
      ::Organization.any_instance.stubs(:owner).returns(@admin_user)

      # INFO: Again, hack to act as if user had organization
      ::User.stubs(:where).with(username: admin_user_username,
                                organization_id: @organization.id).returns([@admin_user])

      post create_session_url(user_domain: user_domain, email: admin_user_username, password: admin_user_password)

      response.status.should == 302
      (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/dashboard\/$/).to_i.should eq 0

      ::User.unstub(:where)

      @admin_user.destroy
    end
  end

  describe 'LDAP authentication' do
    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      bypass_named_maps
      @organization = ::Organization.new
      @organization.seats = 5
      @organization.quota_in_bytes = 100.megabytes
      @organization.name = "ldap-org"
      @organization.default_quota_in_bytes = DEFAULT_QUOTA_IN_BYTES
      @organization.save

      @domain_bases = ["dc=cartodb"]

      @ldap_admin_username = 'user'
      @ldap_admin_cn = "cn=#{@ldap_admin_username},#{@domain_bases[0]}"
      @ldap_admin_password = '666'

      @user_id_field = 'cn'
      @user_email_field = 'mail'

      @ldap_config = Carto::Ldap::Configuration.create(organization_id: @organization.id,
                                                       host: "0.0.0.0",
                                                       port: 389,
                                                       domain_bases_list: @domain_bases,
                                                       connection_user: @ldap_admin_cn,
                                                       connection_password: @ldap_admin_password,
                                                       email_field: @user_email_field,
                                                       user_object_class: '.',
                                                       group_object_class: '.',
                                                       user_id_field: @user_id_field,
                                                       username_field: @user_id_field)
    end

    before(:each) do
      bypass_named_maps
      FakeNetLdap.register_user(username: @ldap_admin_cn, password: @ldap_admin_password)
    end

    after(:each) do
      FakeNetLdap.clear_user_registrations
      FakeNetLdap.clear_query_registrations
    end

    after(:all) do
      bypass_named_maps
      @ldap_config.delete
      @organization.destroy_cascade
    end

    describe 'domainful' do
      it_behaves_like 'LDAP'

      let(:user_domain) { nil }

      before(:each) do
        stub_domainful(@organization.name)
      end
    end

    describe 'subdomainless' do
      it_behaves_like 'LDAP'

      let(:user_domain) { @organization.name }

      before(:each) do
        stub_subdomainless
      end
    end
  end

  shared_examples_for 'SAML' do
    def stub_saml_service(user)
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:get_user_email).returns(user.email)
    end

    it 'redirects to SAML authentication request if enabled' do
      authentication_request = "http://fakesaml.com/authenticate"
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:authentication_request).returns(authentication_request)

      get login_url(user_domain: user_domain)
      response.location.should eq authentication_request
      response.status.should eq 302
    end

    it 'authenticates with SAML if SAMLResponse is present and SAML is enabled' do
      stub_saml_service(@user)
      SessionsController.any_instance.expects(:authenticate!).with(:saml, scope: @user.username).returns(@user).once

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')
    end

    it "Allows to login and triggers creation of normal users if user is not present" do
      new_user = FactoryGirl.build(:carto_user, username: 'new-saml-user', email: 'new-saml-user-email@carto.com')
      stub_saml_service(new_user)
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should == 200
      (response.body =~ /Your account is being created/).to_i.should_not eq 0

      ::User.where(username: new_user.username).first.try(:destroy)
    end

    it "Allows to login and triggers creation of normal users if user is not present" do
      new_user = FactoryGirl.build(:carto_user, username: 'new-saml-user', email: 'new-saml-user-email@carto.com')
      stub_saml_service(new_user)
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should == 200
      (response.body =~ /Your account is being created/).to_i.should_not eq 0

      ::User.where(username: new_user.username).first.try(:destroy)
    end

    it "Fails to authenticate if SAML request fails" do
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:get_user_email).returns(nil)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should == 403
    end

    it "authenticates users with casing differences in email" do
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:get_user_email).returns(@user.email.upcase)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should eq 302

      # Double check authentication is correct
      get response.redirect_url
      response.status.should eq 200
    end

    describe 'SAML logout' do
      it 'calls SamlService#sp_logout_request from user-initiated logout' do
        stub_saml_service(@user)
        SessionsController.any_instance.expects(:authenticate!).with(:saml, scope: @user.username).returns(@user).once

        post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:sp_logout_request).returns('http://carto.com').once
        get logout_url(user_domain: user_domain)
      end

      it 'does not call SamlService#sp_logout_request if logout URL is not configured' do
        stub_saml_service(@user)
        SessionsController.any_instance.expects(:authenticate!).with(:saml, scope: @user.username).returns(@user).once

        post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:logout_url_configured?).returns(false)
        Carto::SamlService.any_instance.stubs(:sp_logout_request).returns('http://carto.com').never
        get logout_url(user_domain: user_domain)
      end

      it 'calls SamlService#idp_logout_request if SAMLRequest is present' do
        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:idp_logout_request).returns('http://carto.com').once
        get logout_url(user_domain: user_domain, SAMLRequest: 'xx')
      end

      it 'calls SamlService#process_logout_response if SAMLResponse is present' do
        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:process_logout_response).returns('http://carto.com').once
        get logout_url(user_domain: user_domain, SAMLResponse: 'xx')
      end
    end
  end

  describe 'SAML authentication' do
    def create
      @organization = FactoryGirl.create(:saml_organization, quota_in_bytes: 1.gigabytes)
      @admin_user = create_admin_user(@organization)
      @user = FactoryGirl.create(:carto_user)
      @user.organization_id = @organization.id
      @user.save
    end

    def cleanup
      @user.destroy
      @organization.destroy
      @admin_user.destroy
    end

    def create_admin_user(organization)
      admin_user_username = "#{organization.name}-admin"
      admin_user_email = "#{organization.name}-admin@test.com"

      admin_user = create_user(
        username: admin_user_username,
        email: admin_user_email,
        password: '2{Patrañas}',
        private_tables_enabled: true,
        quota_in_bytes: 12345,
        organization: nil
      )
      admin_user.save.reload
      @organization.owner = admin_user
      @organization.save

      admin_user
    end

    describe 'domainful' do
      it_behaves_like 'SAML'

      let(:user_domain) { nil }

      before(:each) do
        stub_domainful(@organization.name)
      end

      before(:all) do
        create
      end

      after(:all) do
        cleanup
      end
    end

    describe 'subdomainless' do
      it_behaves_like 'SAML'

      let(:user_domain) { @organization.name }

      before(:each) do
        stub_subdomainless
      end

      before(:all) do
        create
      end

      after(:all) do
        cleanup
      end
    end
  end

  describe '#login' do
    before(:all) do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      @organization = FactoryGirl.create(:organization)
      @user = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @user.destroy
      @organization.destroy
    end

    describe 'with Central' do
      before(:each) do
        Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      end

      it 'redirects to Central for user logins' do
        get login_url(user_domain: @user.username)
        response.status.should == 302
      end

      it 'redirects to Central for orgs without any auth method enabled' do
        Carto::Organization.any_instance.stubs(:auth_enabled?).returns(false)
        get login_url(user_domain: @organization.name)
        response.status.should == 302
      end

      it 'uses the box login for orgs with any auth enabled' do
        Carto::Organization.any_instance.stubs(:auth_enabled?).returns(true)
        get login_url(user_domain: @organization.name)
        response.status.should == 200
      end

      it 'disallows login from an organization login page to a non-member' do
        Carto::Organization.any_instance.stubs(:auth_enabled?).returns(true)
        post create_session_url(user_domain: @organization.name, email: @user.username, password: @user.password)
        response.status.should == 200
        response.body.should include 'Not a member'
      end
    end

    describe 'without Central' do
      before(:each) do
        Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      end

      it 'does not redirect' do
        get login_url(user_domain: @user.username)
        response.status.should == 200
      end

      it 'allows login from an organization login page to a non-member' do
        Carto::Organization.any_instance.stubs(:auth_enabled?).returns(true)
        post create_session_url(user_domain: @organization.name, email: @user.username, password: @user.password)
        response.status.should == 302
      end
    end

    it 'redirects to dashboard if `return_to` url is not present' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      response.status.should == 302
      response.headers['Location'].should include '/dashboard'
    end

    it 'redirects to the `return_to` url if present' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      get api_key_credentials_url(user_domain: @user.username)
      cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
      post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      response.status.should == 302
      response.headers['Location'].should include '/your_apps'
    end

    it 'redirects to current viewer dashboard if the `return_to` dashboard url belongs to other user' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
      get login_url(user_domain: 'wadus_user')
      response.headers['Location'].should include @user.username
      response.headers['Location'].should include "/dashboard"
    end

    it 'redirects to the `return_to` only once url if present' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      get api_key_credentials_url(user_domain: @user.username)

      cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
      post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      response.status.should == 302
      response.headers['Location'].should include '/your_apps'
      Marshal.dump(Base64.decode64(response.cookies["_cartodb_session"]))['return_to'].should be_nil
    end

    describe 'events' do
      # include HttpAuthenticationHelper
      require 'rack/test'
      include Rack::Test::Methods
      include Warden::Test::Helpers

      it 'triggers CartoGearsApi::Events::UserLoginEvent' do
        CartoGearsApi::Events::EventManager.any_instance.expects(:notify).once.with do |event|
          event.class.should eq CartoGearsApi::Events::UserLoginEvent
        end
        post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      end

      it 'sets dashboard_viewed_at just with login' do
        @user.update_column(:dashboard_viewed_at, nil)
        @user.reload
        @user.dashboard_viewed_at.should be_nil

        post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)

        @user.reload
        @user.dashboard_viewed_at.should_not be_nil
      end

      include Warden::Test::Helpers

      it 'triggers CartoGearsApi::Events::UserLoginEvent signaling not first login' do
        login(::User.where(id: @user.id).first)
        logout

        CartoGearsApi::Events::EventManager.any_instance.expects(:notify).once.with do |event|
          event.first_login?.should be_false
        end
        post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      end

      it 'triggers CartoGearsApi::Events::UserLoginEvent signaling first login' do
        @new_user = FactoryGirl.create(:carto_user)
        CartoGearsApi::Events::EventManager.any_instance.expects(:notify).once.with do |event|
          event.first_login?.should be_true
        end
        post create_session_url(user_domain: @new_user.username, email: @new_user.username, password: @new_user.password)
        @new_user.destroy
      end

      it 'returns a CartoGearsApi::Users::User matching the logged user' do
        CartoGearsApi::Events::EventManager.any_instance.expects(:notify).once.with do |event|
          event_user = event.user
          event_user.class.should eq CartoGearsApi::Users::User
          event_user.username.should eq @user.username
        end
        post create_session_url(user_domain: @user.username, email: @user.username, password: @user.password)
      end
    end
  end

  describe '#logout' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @user.destroy
    end

    shared_examples_for 'logout endpoint' do
      it 'redirects to user dashboard' do
        post create_session_url(email: @user.username, password: @user.password)
        get CartoDB.base_url(@user.username) + logout_path
        response.status.should eq 302
        response.location.should include @user.username
      end
    end

    describe 'domainful' do
      it_behaves_like 'logout endpoint'

      before(:each) do
        stub_domainful(@user.username)
      end
    end

    describe 'subdomainless' do
      it_behaves_like 'logout endpoint'

      before(:each) do
        stub_subdomainless
      end
    end
  end

  private

  def bypass_named_maps
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
