require_relative '../spec_helper'
require_relative '../helpers/subdomainless_helper'

require 'fake_net_ldap'
require_relative '../lib/fake_net_ldap_bind_as'

# rubocop:disable RSpec/InstanceVariable
describe SessionsController do

  def create_ldap_user(admin_user_username, admin_user_password)
    admin_user_email = "#{@organization.name}-admin@test.com"
    admin_user_cn = "cn=#{admin_user_username},#{@domain_bases.first}"
    ldap_entry_data = {
      :dn => admin_user_cn,
      @user_id_field => [admin_user_username],
      @user_email_field => [admin_user_email]
    }
    FakeNetLdap.register_user(username: admin_user_cn, password: admin_user_password)
    FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', admin_user_username), [ldap_entry_data])

    create_admin_user(admin_user_username, admin_user_email, admin_user_password)
    @admin_user.save.reload
    Carto::Organization.any_instance.stubs(:owner).returns(@admin_user)

    # INFO: Again, hack to act as if user had organization
    ::User.stubs(:where).with(username: admin_user_username,
                              organization_id: @organization.id).returns([@admin_user])
  end

  def create_admin_user(admin_user_username, admin_user_email, admin_user_password)
    @admin_user = create_user(
      username: admin_user_username,
      email: admin_user_email,
      password: admin_user_password,
      private_tables_enabled: true,
      quota_in_bytes: 12345,
      organization: nil
    )
  end

  shared_examples_for 'LDAP' do
    before do
      Cartodb::Central.stubs(:login_redirection_enabled?).returns(false)
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(false)
    end

    it "doesn't allows to login until admin does first" do
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

      Rails.logger.expects(:warn).with(
        message: 'User not valid at signup',
        errors: { organization: ['Organization owner is not set. Administrator must login first.'] }.inspect
      )

      post create_session_url(user_domain: user_domain, email: normal_user_username, password: normal_user_password)

      response.status.should == 200
      expect(response.body).to include('Signup issues')
    end

    it "Allows to login and triggers creation if using the org admin account" do
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
      expect(response.body).to include('Your account is being created')
    end

    it "Allows to login and triggers creation of normal users if admin already present" do
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
      Carto::Organization.any_instance.stubs(:owner).returns(@admin_user)

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
      expect(response.body).to include('Your account is being created')

      @admin_user.destroy
    end

    it "Just logs in if finds a cartodb username that matches with LDAP credentials " do
      admin_user_username = "#{@organization.name}-admin"
      admin_user_password = '2{Patrañas}'
      create_ldap_user(admin_user_username, admin_user_password)

      post create_session_url(user_domain: user_domain, email: admin_user_username, password: admin_user_password)

      response.status.should == 302
      (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/dashboard\/$/).to_i.should eq 0

      ::User.unstub(:where)

      @admin_user.destroy
    end

    it "Falls back to credentials if user is not present at LDAP" do
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
      Carto::Organization.any_instance.stubs(:owner).returns(@admin_user)

      # INFO: Again, hack to act as if user had organization
      ::User.stubs(:where).with(username: admin_user_username,
                                organization_id: @organization.id).returns([@admin_user])

      post create_session_url(user_domain: user_domain, email: admin_user_username, password: admin_user_password)

      response.status.should == 302
      (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/dashboard\/$/).to_i.should eq 0

      ::User.unstub(:where)

      @admin_user.destroy
    end

    shared_examples_for 'MFA' do
      it "Redirects to multifactor_authentication if finds a cartodb username that matches with LDAP credentials" do
        admin_user_username = "#{@organization.name}-admin"
        admin_user_password = '2{Patrañas}'
        create_ldap_user(admin_user_username, admin_user_password)

        post create_session_url(user_domain: user_domain, email: admin_user_username, password: admin_user_password)

        response.status.should == 302
        (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/dashboard\/$/).to_i.should eq 0

        get response.redirect_url
        response.status.should == 302
        (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/multifactor_authentication\/$/).to_i.should eq 0

        ::User.unstub(:where)

        @admin_user.destroy
      end
    end
  end

  describe 'LDAP authentication' do
    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      bypass_named_maps
      @organization = Carto::Organization.new
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

      describe 'MFA' do
        def create_admin_user(admin_user_username, admin_user_email, admin_user_password)
          @admin_user = create_user(
            username: admin_user_username,
            email: admin_user_email,
            password: admin_user_password,
            private_tables_enabled: true,
            quota_in_bytes: 12345,
            organization: nil
          )

          @admin_user.user_multifactor_auths << create(:totp, :active, user_id: @admin_user.id)
          @admin_user.save
        end

        it_behaves_like 'LDAP'
        it_behaves_like 'MFA'
      end
    end

    describe 'subdomainless' do
      it_behaves_like 'LDAP'

      let(:user_domain) { @organization.name }

      before(:each) do
        stub_subdomainless
      end

      describe 'MFA' do
        def create_admin_user(admin_user_username, admin_user_email, admin_user_password)
          @admin_user = create_user(
            username: admin_user_username,
            email: admin_user_email,
            password: admin_user_password,
            private_tables_enabled: true,
            quota_in_bytes: 12345,
            organization: nil
          )

          @admin_user.user_multifactor_auths << create(:totp, :active, user_id: @admin_user.id)
          @admin_user.save
        end

        it_behaves_like 'LDAP'
        it_behaves_like 'MFA'
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
      new_user = build(:carto_user, username: 'new-saml-user', email: 'new-saml-user-email@carto.com')
      stub_saml_service(new_user)
      Cartodb::Central.stubs(:login_redirection_enabled?).returns(false)
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(false)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should == 200
      expect(response.body).to include('Your account is being created')

      ::User.where(username: new_user.username).first.try(:destroy)
    end

    it "Allows to login and triggers creation of normal users if user is not present" do
      new_user = build(:carto_user, username: 'new-saml-user', email: 'new-saml-user-email@carto.com')
      stub_saml_service(new_user)
      Cartodb::Central.stubs(:login_redirection_enabled?).returns(false)
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(false)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should == 200
      expect(response.body).to include('Your account is being created')

      ::User.where(username: new_user.username).first.try(:destroy)
    end

    it "Fails to authenticate if SAML request fails" do
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:get_user_email).returns(nil)

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should == 403
    end

    describe 'SAML logout' do
      it 'calls SamlService#sp_logout_request from user-initiated logout' do
        described_class.any_instance.stubs(:current_user).returns(@user)
        stub_saml_service(@user)

        host! "#{@user.username}.localhost.lan"
        post create_session_url(email: @user.email, password: password)

        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:sp_logout_request).returns('http://carto.com').once
        get logout_url(user_domain: user_domain)
      end

      it 'does not call SamlService#sp_logout_request if logout URL is not configured' do
        stub_saml_service(@user)

        host! "#{@user.username}.localhost.lan"
        post create_session_url(email: @user.email, password: password)

        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:logout_url_configured?).returns(false)
        Carto::SamlService.any_instance.stubs(:sp_logout_request).returns('http://carto.com').never
        get logout_url(user_domain: user_domain)
      end

      it 'calls SamlService#idp_logout_request if SAMLRequest is present' do
        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:logout_url_configured?).returns(true)
        Carto::SamlService.any_instance.stubs(:idp_logout_request).returns('http://carto.com').once
        get logout_url(user_domain: user_domain, SAMLRequest: 'xx')
      end

      it 'calls SamlService#process_logout_response if SAMLResponse is present' do
        # needs returning an url to do a redirection
        Carto::SamlService.any_instance.stubs(:logout_url_configured?).returns(true)
        Carto::SamlService.any_instance.stubs(:process_logout_response).returns('http://carto.com').once
        get logout_url(user_domain: user_domain, SAMLResponse: 'xx')
      end
    end

    shared_examples_for 'SAML no MFA' do
      it "authenticates users with casing differences in email" do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
        Carto::SamlService.any_instance.stubs(:get_user_email).returns(@user.email.upcase)

        post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

        response.status.should eq 302

        # Double check authentication is correct
        get response.redirect_url
        response.status.should eq 200
      end
    end
  end

  describe 'SAML authentication' do
    let(:password) { '12345678' }
    let(:organization) do
      create(
        :organization_with_users, :saml_enabled,
        quota_in_bytes: 1.gigabytes,
        viewer_seats: 20
      )
    end
    let(:user) do
      create(
        :carto_user,
        organization_id: organization.id,
        password: password,
        password_confirmation: password,
        factory_bot_context: { only_db_setup: true }
      )
    end
    let(:saml_user) do
      user = create(
        :carto_user,
        organization_id: organization.id,
        password: password,
        password_confirmation: password,
        factory_bot_context: { only_db_setup: true }
      )
      create(
        :user_creation,
        user_id: user.id,
        created_via: Carto::UserCreation::CREATED_VIA_SAML
      )
      user
    end

    def setup_saml_organization
      @organization = organization
      @admin_user = @organization.owner
      @user = saml_user
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
      @organization.owner_id = admin_user.id
      @organization.save

      admin_user
    end

    describe 'user with MFA' do
      it "redirects to multifactor_authentication" do
        # we use this to avoid generating the static assets in CI
        Admin::VisualizationsController.any_instance.stubs(:render).returns('')

        Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
        Carto::SamlService.any_instance.stubs(:get_user_email).returns(@user.email)

        post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

        response.status.should eq 302

        get response.redirect_url
        response.status.should eq 302
        response.redirect_url.should include '/multifactor_authentication'
      end

      let(:user_domain) { nil }

      before(:each) do
        stub_domainful(@organization.name)
      end

      before(:all) do
        setup_saml_organization
        @user.user_multifactor_auths << create(:totp, :active, user_id: @user.id)
        @user.save

        @admin_user.user_multifactor_auths << create(:totp, :active, user_id: @admin_user.id)
        @admin_user.save
      end

      after(:all) do
        cleanup
      end
    end
  end

  describe '#login' do
    let(:password) { '1234-abcd-5678' }

    before(:all) do
      @organization = create(:organization)
      @user = create(:carto_user, password: password, password_confirmation: password)
    end

    after(:all) do
      @user.destroy
      @organization.destroy
    end

    describe 'with Central' do
      before do
        Cartodb::Central.stubs(:login_redirection_enabled?).returns(true)
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
        post create_session_url(user_domain: @organization.name, email: @user.username, password: password)
        response.status.should == 200
        response.body.should include 'Not a member'
      end
    end

    describe 'without Central' do
      it 'does not redirect' do
        get login_url(user_domain: @user.username)
        response.status.should == 200
      end

      it 'allows login from an organization login page to a non-member' do
        Carto::Organization.any_instance.stubs(:auth_enabled?).returns(true)
        post create_session_url(user_domain: @organization.name, email: @user.username, password: password)
        response.status.should == 302
      end

      it 'redirects to dashboard if `return_to` url is not present' do
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
        response.status.should == 302
        response.headers['Location'].should include '/dashboard'
      end

      it 'redirects to the `return_to` url if present' do
        get api_key_credentials_url(user_domain: @user.username)
        cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
        response.status.should == 302
        response.headers['Location'].should include '/your_apps'
      end

      it 'redirects to current viewer dashboard if the `return_to` dashboard url belongs to other user' do
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
        cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
        get login_url(user_domain: 'wadus_user')
        response.headers['Location'].should include @user.username
        response.headers['Location'].should include "/dashboard"
      end

      it 'redirects to the `return_to` only once url if present' do
        get api_key_credentials_url(user_domain: @user.username)

        cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
        response.status.should == 302
        response.headers['Location'].should include '/your_apps'
        Marshal.dump(Base64.decode64(response.cookies["_cartodb_session"]))['return_to'].should be_nil
      end

      it 'creates _cartodb_base_url cookie' do
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
        response.cookies['_cartodb_base_url'].should eq CartoDB.base_url(@user.username)
      end
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
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
      end

      it 'sets dashboard_viewed_at just with login' do
        @user.update_column(:dashboard_viewed_at, nil)
        @user.reload
        @user.dashboard_viewed_at.should be_nil

        post create_session_url(user_domain: @user.username, email: @user.username, password: password)

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
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
      end

      it 'triggers CartoGearsApi::Events::UserLoginEvent signaling first login' do
        @new_user = create(:carto_user, password: password, password_confirmation: password)
        CartoGearsApi::Events::EventManager.any_instance.expects(:notify).once.with do |event|
          event.first_login?.should be_true
        end
        post create_session_url(user_domain: @new_user.username, email: @new_user.username, password: password)
        @new_user.destroy
      end

      it 'returns a CartoGearsApi::Users::User matching the logged user' do
        CartoGearsApi::Events::EventManager.any_instance.expects(:notify).once.with do |event|
          event_user = event.user
          event_user.class.should eq CartoGearsApi::Users::User
          event_user.username.should eq @user.username
        end
        post create_session_url(user_domain: @user.username, email: @user.username, password: password)
      end
    end
  end

  describe '#multifactor_authentication' do
    include Warden::Test::Helpers
    def login(user = @user)
      logout
      host! "#{user.username}.localhost.lan"
      login_as(user, scope: user.username)
    end

    def create_session
      post create_session_url(email: @user.username, password: @user.password)
    end

    def code
      ROTP::TOTP.new(@user.active_multifactor_authentication.shared_secret).now
    end

    def expect_login_error
      response.status.should eq 200
      request.path.should_not include '/dashboard'
      response.body.should include 'Sessions-fieldError'
    end

    def expect_login
      response.status.should eq 302
      response.headers['Location'].should include "/dashboard"
    end

    def expect_invalid_code
      response.status.should eq 200
      request.path.should include '/multifactor_authentication'
      response.body.should include 'Verification code is not valid'
    end

    shared_examples_for 'all users workflow' do
      before(:each) do
        @user.user_multifactor_auths.each(&:destroy)
        @user.user_multifactor_auths << create(:totp, :active, user_id: @user.id)
        @user.reload
        @user.reset_password_rate_limit
      end

      after(:each) do
        SessionsController::MAX_MULTIFACTOR_AUTHENTICATION_INACTIVITY = 120.seconds
      end

      it 'verifies a valid code' do
        login

        get multifactor_authentication_session_url
        post multifactor_authentication_verify_code_url(user_id: @user.id, code: code)

        expect_login
      end

      it 'redirects to login and then to code verification when there is no session' do
        get dashboard_url
        follow_redirect!

        login
        post create_session_url(email: @user.username, password: @user.password)
        ApplicationController.any_instance.stubs(:current_viewer).returns(@user)
        ApplicationController.any_instance.stubs(:multifactor_authentication_required?).returns(true)
        follow_redirect!

        request.path.should eq multifactor_authentication_verify_code_path
      end

      it 'does not verify an invalid code' do
        login

        get multifactor_authentication_session_url
        post multifactor_authentication_verify_code_url(user_id: @user.id, code: 'invalid_code')

        expect_invalid_code
      end

      it 'does not verify an already used code' do
        login

        get multifactor_authentication_session_url
        post multifactor_authentication_verify_code_url(user_id: @user.id, code: code)
        expect_login

        logout
        login

        get multifactor_authentication_session_url
        post multifactor_authentication_verify_code_url(user_id: @user.id, code: code)

        expect_invalid_code
      end

      it 'logout if user inactive' do
        login

        SessionsController::MAX_MULTIFACTOR_AUTHENTICATION_INACTIVITY = -1
        get multifactor_authentication_session_url
        post multifactor_authentication_verify_code_url(user_id: @user.id, code: code)

        response.status.should eq 302
        response.headers['Location'].should include 'login?error=multifactor_authentication_inactivity'

        follow_redirect!
        response.status.should eq 200
        response.body.should include("You've been logged out due to a long time of inactivity")
      end

      it 'rate limits verification code' do
        login

        Cartodb.with_config(
          passwords: {
            'rate_limit' => {
              'max_burst' => 0,
              'count' => 1,
              'period' => 10
            }
          }
        ) do
          @user.reset_password_rate_limit
          get multifactor_authentication_session_url
          post multifactor_authentication_verify_code_url(user_id: @user.id, code: 'invalid_code')
          post multifactor_authentication_verify_code_url(user_id: @user.id, code: 'invalid_code')

          response.status.should eq 302
          response.headers['Location'].should include '/login?error=password_locked'
        end
      end

      it 'allows to login after the locked password period' do
        Cartodb.with_config(
          passwords: {
            'rate_limit' => {
              'max_burst' => 0,
              'count' => 1,
              'period' => 3
            }
          }
        ) do
          @user.reset_password_rate_limit
          login

          get multifactor_authentication_session_url
          post multifactor_authentication_verify_code_url(user_id: @user.id, code: 'invalid_code')
          expect_invalid_code

          post multifactor_authentication_verify_code_url(user_id: @user.id, code: 'invalid_code')
          response.status.should eq 302
          response.headers['Location'].should include '/login?error=password_locked'

          @user.reload
          sleep(4)

          login
          get multifactor_authentication_session_url
          cookies["_cartodb_session"] = response.cookies["_cartodb_session"]
          post multifactor_authentication_verify_code_url(user_id: @user.id, code: code)
          expect_login
        end
      end

      context 'skipping MFA configuration' do
        before(:each) do
          mfa = @user.active_multifactor_authentication
          mfa.enabled = false
          mfa.save!
        end

        after(:each) do
          create(:totp, :needs_setup, user_id: @user.id)
          @user.reload
        end

        it 'skips configuration only when mfa needs setup' do
          login

          get multifactor_authentication_session_url
          post multifactor_authentication_verify_code_url(user_id: @user.id, skip: true)

          expect_login
        end

        it 'removes user multifactor auths when mfa configuration is skipped' do
          login

          get multifactor_authentication_session_url
          post multifactor_authentication_verify_code_url(user_id: @user.id, skip: true)

          @user.reload.user_multifactor_auths.should be_empty
        end

        it 'does not allow to skip verification if is active' do
          mfa = @user.active_multifactor_authentication
          mfa.enabled = true
          mfa.save!

          login

          get multifactor_authentication_session_url
          post multifactor_authentication_verify_code_url(user_id: @user.id, skip: true)

          expect_invalid_code
        end
      end
    end

    shared_examples_for 'organizational user' do
      shared_examples_for 'organization custom view' do
        it 'shows organization custom view' do
          get multifactor_authentication_session_url

          expect(response.body).to include(@organization.name)
        end
      end

      context 'subdomainless' do
        before(:each) do
          stub_subdomainless
          login
        end

        include_examples 'organization custom view'
      end

      context 'domainful' do
        before(:each) do
          stub_domainful(@organization.name)
          login
        end

        include_examples 'organization custom view'
      end
    end

    describe 'as individual user' do
      before(:all) do
        @user = create(:carto_user_mfa)
      end

      after(:all) do
        @user.destroy
      end

      it_behaves_like 'all users workflow'
    end

    describe 'as org owner' do
      before(:all) do
        @organization = create(:organization_with_users, :mfa_enabled)
        @user = @organization.owner
        @user.password = @user.password_confirmation = @user.crypted_password = '00012345678'
        @user.save
      end

      after(:all) do
        @organization.destroy
      end

      def create_session
        post create_session_url(user_domain: @user.username, email: @user.username, password: '00012345678')
      end

      it_behaves_like 'all users workflow'
      it_behaves_like 'organizational user'
    end

    describe 'as org user' do
      before(:all) do
        @organization = create(:organization_with_users, :mfa_enabled)
        @user = @organization.users.last
        @user.password = @user.password_confirmation = @user.crypted_password = '00012345678'
        @user.save
      end

      after(:all) do
        @organization.destroy
      end

      def create_session
        post create_session_url(user_domain: @user.username, email: @user.username, password: '00012345678')
      end

      it_behaves_like 'all users workflow'
      it_behaves_like 'organizational user'
    end

    describe 'as org without user pass enabled' do
      before(:all) do
        Carto::Organization.any_instance.stubs(:auth_enabled?).returns(true)
        @organization = create(:organization_with_users,
                                           :mfa_enabled,
                                           auth_username_password_enabled: false)
        @user = @organization.users.last
        @user.password = @user.password_confirmation = @user.crypted_password = '00012345678'
        @user.save
      end

      after(:all) do
        @organization.destroy
      end

      def login(user = @user)
        logout
        host! "#{@organization.name}.localhost.lan"
        login_as(user, scope: user.username)
      end

      def create_session
        post create_session_url(user_domain: @organization.name, email: @user.username, password: @user.password)
      end

      it_behaves_like 'all users workflow'
    end
  end

  describe '#logout' do
    before(:all) do
      @user = create(:carto_user)
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

  describe '#destroy' do
    it 'deletes the _cartodb_base_url cookie' do
      @user = create(:carto_user)
      login_as(@user, scope: @user.username)
      host! "localhost.lan"

      cookies['_cartodb_base_url'] = 'prra-prra'
      get CartoDB.base_url(@user.username) + logout_path
      cookies['_cartodb_base_url'].should be_empty
    end
  end

  private

  def bypass_named_maps
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
# rubocop:enable RSpec/InstanceVariable
