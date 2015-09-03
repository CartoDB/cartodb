require_relative '../spec_helper'

require 'fake_net_ldap'

describe SessionsController do

  describe 'login with LDAP' do

    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      @organization = ::Organization.new
      @organization.seats = 5
      @organization.quota_in_bytes =  100.megabytes
      @organization.name = "ldap-org"
      @organization.default_quota_in_bytes = DEFAULT_QUOTA_IN_BYTES
      @organization.save

      @domain_bases = [ "dc=cartodb" ]

      @ldap_admin_username = 'user'
      @ldap_admin_cn = "cn=#{@ldap_admin_username},#{@domain_bases[0]}"
      @ldap_admin_password =  '666'

      @user_id_field = 'cn'
      @user_email_field = 'mail'

      @ldap_config = Carto::Ldap::Configuration.create({
        organization_id: @organization.id,
        host: "0.0.0.0",
        port: 389,
        domain_bases_list: @domain_bases,
        connection_user: @ldap_admin_cn,
        connection_password: @ldap_admin_password,
        email_field: @user_email_field,
        user_object_class: '.',
        group_object_class: '.',
        user_id_field: @user_id_field,
        username_field: @user_id_field
      })
    end

    before(:each) do
      FakeNetLdap.register_user(:username => @ldap_admin_cn, :password => @ldap_admin_password)
    end

    after(:each) do
      FakeNetLdap.clear_user_registrations
      FakeNetLdap.clear_query_registrations
    end

    after(:all) do
      @ldap_config.delete
    end

    it "doesn't allows to login until admin does first" do
      normal_user_username = "ldap-user"
      normal_user_password = "foobar"
      normal_user_email = "ldap-user@test.com"
      normal_user_cn = "cn=#{normal_user_username},#{@domain_bases.first}"
      ldap_entry_data = { 
          @user_id_field => [normal_user_username],
          @user_email_field => [normal_user_email]
        }
      FakeNetLdap.register_user(:username => normal_user_cn, :password => normal_user_password)
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', normal_user_username), ldap_entry_data)

      errors = {
          :errors => {
              :organization => ["owner is not set. In order to activate this organization the administrator must login first"]
          }
        }
      ::CartoDB.expects(:notify_debug).with('User not valid at signup', errors).returns(nil)

      host! "#{@organization.name}.localhost.lan"
      post create_session_url(user_domain: nil, email: normal_user_username, password: normal_user_password)

      response.status.should == 200
      (response.body =~ /Signup issues/).to_i.should_not eq 0
    end

    it "allows to login and triggers creation if using the org admin account" do
      # @See lib/user_account_creator.rb -> promote_to_organization_owner?
      admin_user_username = "#{@organization.name}-admin"
      admin_user_password = "foobar"
      admin_user_email = "#{@organization.name}-admin@test.com"
      admin_user_cn = "cn=#{admin_user_username},#{@domain_bases.first}"
      ldap_entry_data = { 
          @user_id_field => [admin_user_username],
          @user_email_field => [admin_user_email]
        }
      FakeNetLdap.register_user(:username => admin_user_cn, :password => admin_user_password)
      FakeNetLdap.register_query(Net::LDAP::Filter.eq('cn', admin_user_username), ldap_entry_data)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser, 
        instance_of(String), instance_of(String), instance_of(TrueClass)).returns(true)

      host! "#{@organization.name}.localhost.lan"
      post create_session_url(user_domain: nil, email: admin_user_username, password: admin_user_password)

      response.status.should == 200
      
      (response.body =~ /Your account is being created/).to_i.should_not eq 0
    end


    it "triggers a NewUser job with the org owner admin when conditions are met" do
      pending "TBD"

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser, 
        instance_of(String), instance_of(String), instance_of(FalseClass)).returns(true)

      email = "testemail@#{@organization.whitelisted_email_domains[0]}"
      password = 'testpassword' 
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, user: { username: username, email: email, password: password })
      response.status.should == 200
      last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
      last_user_creation.username.should == username
      last_user_creation.email.should == email
      last_user_creation.crypted_password.should_not be_empty
      last_user_creation.salt.should_not be_empty
      last_user_creation.organization_id.should == @organization.id
      last_user_creation.quota_in_bytes.should == @organization.default_quota_in_bytes
    end

  end

end
