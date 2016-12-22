require_relative '../spec_helper'

require 'fake_net_ldap'
require_relative '../lib/fake_net_ldap_bind_as'

describe SessionsController do
  describe 'login with LDAP' do
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

      host! "#{@organization.name}.localhost.lan"
      post create_session_url(user_domain: nil, email: normal_user_username, password: normal_user_password)

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

      host! "#{@organization.name}.localhost.lan"
      post create_session_url(user_domain: nil, email: admin_user_username, password: admin_user_password)

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

      host! "#{@organization.name}.localhost.lan"
      post create_session_url(user_domain: nil, email: normal_user_username, password: normal_user_password)

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

      host! "#{@organization.name}.localhost.lan"
      post create_session_url(user_domain: nil, email: admin_user_username, password: admin_user_password)

      response.status.should == 302
      (response.location =~ /^http\:\/\/#{admin_user_username}(.*)\/dashboard\/$/).to_i.should eq 0

      ::User.unstub(:where)

      @admin_user.destroy
    end
  end

  shared_examples_for 'SAML' do
    let(:subdomain) { "samlsubdomain" }

    before(:all) do
      @organization = FactoryGirl.create(:saml_organization)
      @user = FactoryGirl.create(:carto_user)
    end

    after(:all) do
      @organization.destroy
      @user.destroy
    end

    it 'redirects to SAML authentication request if enabled' do
      authentication_request = "http://fakesaml.com/authenticate"
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:authentication_request).returns(authentication_request)

      get login_url(user_domain: @organization.name)
      response.location.should eq authentication_request
      response.status.should eq 302
    end

    it 'authenticates with SAML if SAMLResponse is present and SAML is enabled' do
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:username).returns(subdomain)

      SessionsController.any_instance.expects(:authenticate!).with(:saml, scope: subdomain).returns(@user).once

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')
    end

    # If SAML returns authentication error we should fallback to login
    it 'fallbacks to login if SAMLResponse is present and SAML is enabled but subdomain is nil' do
      Carto::SamlService.any_instance.stubs(:enabled?).returns(true)
      Carto::SamlService.any_instance.stubs(:username).returns(subdomain)
      failed_saml_response = mock
      failed_saml_response.stubs(:is_valid?).returns(false)
      Carto::SamlService.any_instance.stubs(:get_saml_response).returns(failed_saml_response)

      sessions_controller = SessionsController.any_instance
      sessions_controller.expects(:authenticate!).with(:saml, scope: subdomain).once
      sessions_controller.expects(:authenticate!).with(:password, scope: @organization.name).returns(nil).once

      post create_session_url(user_domain: user_domain, SAMLResponse: 'xx')

      response.status.should eq 200
    end
  end

  describe 'domainful' do
    let(:user_domain) { nil }

    before(:each) do
      CartoDB.stubs(:session_domain).returns('.localhost.lan')
      CartoDB.stubs(:subdomainless_urls?).returns(false)
      host! "#{@organization.name}.localhost.lan"
    end

    it_behaves_like 'SAML'
  end

  describe 'subdomainless' do
    let(:user_domain) { @organization.name }

    before(:each) do
      CartoDB.stubs(:session_domain).returns('localhost.lan')
      CartoDB.stubs(:subdomainless_urls?).returns(true)
      host! "localhost.lan"
    end

    it_behaves_like 'SAML'
  end

  private

  def bypass_named_maps
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end
end
