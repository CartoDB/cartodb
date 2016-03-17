require_relative '../spec_helper'
require_relative './http_authentication_helper'

describe SignupController do

  before(:each) do
    ::User.any_instance.stubs(:load_common_data).returns(true)
  end

  describe 'signup page' do

    after(:each) do
      @fake_organization.delete if @fake_organization
    end

    it 'returns 404 outside organization subdomains' do
      get signup_url
      response.status.should == 404
      post signup_organization_user_url
      response.status.should == 404
    end

    it 'returns 200 for organizations with signup_page_enabled' do
      @fake_organization = FactoryGirl.create(:organization, whitelisted_email_domains: ['cartodb.com'] )
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 200
    end

    it 'returns 404 for organizations without signup_page_enabled' do
      @fake_organization = FactoryGirl.create(:organization, whitelisted_email_domains: [] )
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 404
    end

    it 'returns user error with admin mail if organization has not enough seats' do
      fake_owner = FactoryGirl.build(:valid_user)
      @fake_organization = FactoryGirl.create(:organization, whitelisted_email_domains: ['cartodb.com'], seats: 0, owner: fake_owner)
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 200
      response.body.should match(/Please, contact the administrator of #{@fake_organization.name}/)
      response.body.should match(Regexp.new @fake_organization.owner.email)
    end

  end

  describe 'user creation' do
    include_context 'organization with users helper'

    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      @organization.whitelisted_email_domains = ['cartodb.com']
      @organization.default_quota_in_bytes = DEFAULT_QUOTA_IN_BYTES
      @organization.save

      @org_2_user_owner = TestUserFactory.new.create_owner(@organization_2)
    end

    before(:each) do
      @organization.auth_username_password_enabled = true
      @organization.auth_google_enabled = true
      @organization.save
    end

    it 'triggers validation error and not a NewUser job if email is not valid' do
      ::Resque.expects(:enqueue).never

      username = 'testusername'
      email = 'testemail@nonono.com'
      password = '2{Patrañas}'
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, user: { username: username, email: email, password: password })
      response.status.should == 422
      last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
      last_user_creation.should == nil
    end

    it 'triggers validation error is password is too short' do
      user = ::User.new

      user.username = 'testusername'
      user.email = 'manolo@escobar.es'
      user.password = 'short'
      user.password_confirmation = user.password

      user.errors[:password].blank?.should == false
    end

    it 'returns 400 error if you attempt username + password signup and it is not valid' do
      @organization.auth_username_password_enabled = false
      @organization.save

      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, user: { username: 'anewuser', email: "anewuser@#{@organization.whitelisted_email_domains.first}", password: 'password' })
      response.status.should == 400
      ::Resque.expects(:enqueue).never
    end

    it 'returns 400 error if you attempt Google signup and it is not valid' do
      ::GooglePlusConfig.stubs(:instance).returns({})
      GooglePlusAPI.any_instance.expects(:get_user_data).never
      @organization.auth_google_enabled = false
      @organization.save
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, google_access_token: 'whatever')
      response.status.should == 400

      post signup_organization_user_url(user_domain: @organization.name, google_signup_access_token: 'whatever')
      response.status.should == 400
    end

    it 'triggers a NewUser job with form parameters and default quota and requiring validation email' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)

      username = 'testusername'
      email = "testemail@#{@organization.whitelisted_email_domains[0]}"
      password = '2{Patrañas}'
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
      last_user_creation.requires_validation_email?.should == true
      last_user_creation.created_via.should == Carto::UserCreation::CREATED_VIA_ORG_SIGNUP
    end

    it 'Returns 422 for not whitelisted domains' do
      ::Resque.expects(:enqueue).never

      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name,
                                        user: { username: 'evil', email: 'evil@whatever.com', password: '2{Patrañas}' })
      response.status.should == 422
    end

    it "doesn't trigger creation if mail domain is not whitelisted and invitation token is wrong" do
      ::Resque.stubs(:enqueue)
      ::Resque.expects(:enqueue).
        with(::Resque::UserJobs::Signup::NewUser, anything, anything, anything).
        never
      invited_email = 'invited_user@whatever.com'
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_user_owner.id), [invited_email], 'Welcome!')
      invitation.save

      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(
        user_domain: @organization.name,
        user: { username: 'invited-user', email: invited_email, password: '2{Patrañas}' },
        invitation_token: 'wrong'
      )
      response.status.should == 400
      invitation.reload
      invitation.used_emails.should_not include(invited_email)
    end

    it 'returns 400 if invitation token is for a different organization' do
      invited_email = 'invited_user@whatever.com'
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_2_user_owner.id), [invited_email], 'Welcome!')
      invitation.save

      ::Resque.expects(:enqueue).
        with(::Resque::UserJobs::Signup::NewUser, instance_of(String), anything, instance_of(FalseClass)).
        never
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name,
                                        user: { username: 'invited-user',
                                                email: invited_email,
                                                password: '2{Patrañas}' },
                                        invitation_token: invitation.token(invited_email))
      response.status.should == 400
      invitation.reload
      invitation.used_emails.should_not include(invited_email)
    end

    it 'triggers creation without validation email spending an invitation even if mail domain is not whitelisted' do
      invited_email = 'invited_user@whatever.com'
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_user_owner.id), [invited_email], 'Welcome!')
      invitation.save

      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      ::Resque.expects(:enqueue).
        with(::Resque::UserJobs::Signup::NewUser, instance_of(String), anything, instance_of(FalseClass)).
        returns(true)
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name,
                                        user: { username: 'invited-user',
                                                email: invited_email,
                                                password: '2{Patrañas}' },
                                        invitation_token: invitation.token(invited_email))
      response.status.should == 200
      last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
      @organization.whitelisted_email_domains.should_not include(last_user_creation.email)
      last_user_creation.organization_id.should == @organization.id
      last_user_creation.requires_validation_email?.should == false
      invitation.reload
      invitation.used_emails.should include(invited_email)
    end

    describe 'ldap signup' do

      before(:all) do
        @ldap_configuration = FactoryGirl.create(:ldap_configuration, { organization_id: @organization.id })
      end

      after(:all) do
        @ldap_configuration.destroy
      end

      it 'returns 404 if ldap is enabled' do

        get signup_organization_user_url(user_domain: @organization.name)
        response.status.should == 404

        post signup_organization_user_url(user_domain: @organization.name, user: { username: 'whatever', email: 'whatever@cartodb.com', password: 'whatever' })
        response.status.should == 404
      end

    end

    describe 'http authentication signup' do
      include HttpAuthenticationHelper

      describe 'header authentication disabled' do
        it 'returns 404 if http authentication is not set' do
          stub_http_header_authentication_configuration(enabled: false)
          get signup_http_authentication_url
          response.status.should == 404
        end

        it 'returns 404 if http authentication autocreation is disabled' do
          stub_http_header_authentication_configuration(autocreation: false)
          get signup_http_authentication_url
          response.status.should == 404
        end
      end

      describe 'header authentication enabled' do
        it 'returns 404 if http authentication autocreation is disabled' do
          stub_http_header_authentication_configuration(autocreation: false)
          get signup_http_authentication_url
          response.status.should == 404
        end

        it 'returns 500 if http authentication is not set to email' do
          ['auto', 'id', 'username'].each do |field|
            stub_http_header_authentication_configuration(autocreation: true, field: field)
            get signup_http_authentication_url
            response.status.should == 500
          end
        end

        describe 'autocreation enabled' do
          before(:each) do
            stub_http_header_authentication_configuration(autocreation: true)
          end

          it 'returns 403 if http authentication header is not present' do
            get signup_http_authentication_url
            response.status.should == 403
          end

          it 'triggers user creation without organization' do
            Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
            email = 'authenticated@whatever.com'

            ::Resque.expects(:enqueue).
              with(::Resque::UserJobs::Signup::NewUser, instance_of(String), anything, instance_of(FalseClass)).
              returns(true)
            get signup_http_authentication_url, {}, authentication_headers(email)
            response.status.should == 200

            last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
            last_user_creation.organization_id.should == nil
            last_user_creation.requires_validation_email?.should == false
          end

          it 'triggers user creation with organization' do
            Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
            username = "authenticated"
            email = "#{username}@#{@organization.whitelisted_email_domains.first}"

            ::Resque.expects(:enqueue).
              with(::Resque::UserJobs::Signup::NewUser, instance_of(String), anything, instance_of(FalseClass)).
              returns(true)

            host! "#{@organization.name}.localhost.lan"
            get signup_http_authentication_url(user_domain: @organization.name), {}, authentication_headers(email)
            response.status.should == 200

            last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
            last_user_creation.organization_id.should == @organization.id
            last_user_creation.requires_validation_email?.should == false
            last_user_creation.username.should == username
            last_user_creation.email.should == email
            last_user_creation.crypted_password.should_not be_empty
          end
        end
      end
    end
  end
end
