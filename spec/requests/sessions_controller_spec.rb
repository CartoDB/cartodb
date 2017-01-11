require_relative '../spec_helper'

require 'fake_net_ldap'
require_relative '../lib/fake_net_ldap_bind_as'

describe SessionsController do
  def stub_domainful(subdomain)
    CartoDB.stubs(:session_domain).returns('.localhost.lan')
    CartoDB.stubs(:subdomainless_urls?).returns(false)
    host! "#{subdomain}.localhost.lan"
  end

  def stub_subdomainless
    CartoDB.stubs(:session_domain).returns('localhost.lan')
    CartoDB.stubs(:subdomainless_urls?).returns(true)
    host! "localhost.lan"
  end

  shared_examples_for 'Google' do
    before(:all) do
      google_plus_config_mock = mock
      google_plus_config_mock.stubs(:domain).returns { user_domain }
      google_plus_config_mock.stubs(:access_token_field_id).returns('atfi')
      google_plus_config_mock.stubs(:iframe_src).returns('')
      google_plus_config_mock.stubs(:signup_action).returns('')
      google_plus_config_mock.stubs(:unauthenticated_valid_access_token).returns('')
      GooglePlusConfig.stubs(:instance).returns(google_plus_config_mock)

      @user = FactoryGirl.create(:carto_user, username: 'google_user')
    end

    after(:all) do
      @user.destroy
    end

    it 'attempts Google authentication if google is enabled and there is a google_access_token param' do
      access_token = 'kkk'
      GooglePlusAPI.any_instance.stubs(:get_user).with(access_token).once.returns(@user)
      SessionsController.any_instance.expects(:authenticate!).with(:google_access_token, scope: @user.username)
          .returns(@user).once
      post create_session_url(user_domain: user_domain, google_access_token: access_token)
    end
  end

  describe 'Google authentication' do
    describe 'domainful' do
      it_behaves_like 'Google'

      let(:user_domain) { @user.username }

      before(:each) do
        stub_domainful(@user.username)
      end
    end

    describe 'subdomainless' do
      it_behaves_like 'Google'

      let(:user_domain) { nil }

      before(:each) do
        stub_subdomainless
      end
    end
  end

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

      response.status.should == 200
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
  end

  private

  def bypass_named_maps
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
