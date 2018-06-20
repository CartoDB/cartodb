require_relative '../spec_helper'
require_relative './http_authentication_helper'
require 'helpers/unique_names_helper'

describe SignupController do
  include UniqueNamesHelper

  before(:each) do
    ::User.any_instance.stubs(:load_common_data).returns(true)
  end

  describe 'signup page' do
    include_context 'organization with users helper'

    after(:each) do
      @fake_organization.delete if @fake_organization
    end

    it 'returns 200 when subdomainless and route is signup_subdomainless' do
      @fake_organization = FactoryGirl.create(:organization_whitelist_carto)
      CartoDB.stubs(:subdomainless_urls?).returns(true)
      CartoDB.stubs(:session_domain).returns('localhost.lan')
      Organization.stubs(:where).returns([@fake_organization])
      host! "localhost.lan"
      get signup_subdomainless_url(user_domain: 'organization')
      response.status.should == 200
    end

    it 'returns 404 when subdomainless and route is signup' do
      @fake_organization = FactoryGirl.create(:organization_whitelist_carto)
      CartoDB.stubs(:subdomainless_urls?).returns(true)
      CartoDB.stubs(:session_domain).returns('localhost.lan')
      Organization.stubs(:where).returns([@fake_organization])
      host! "localhost.lan"
      get signup_url
      response.status.should == 404
    end

    it 'returns 404 outside organization subdomains' do
      get signup_url
      response.status.should == 404
      post signup_organization_user_url
      response.status.should == 404
    end

    it 'returns 200 for organizations with signup_page_enabled' do
      @fake_organization = FactoryGirl.create(:organization_whitelist_carto)
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 200
    end

    it 'returns 404 for organizations without signup_page_enabled' do
      @fake_organization = FactoryGirl.create(:organization, whitelisted_email_domains: [])
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 404
    end

    it 'returns 404 for organizations with whitelisted domains but without any authentication enabled' do
      @fake_organization = FactoryGirl.create(:organization_whitelist_carto,
                                              auth_username_password_enabled: true,
                                              auth_google_enabled: false,
                                              auth_github_enabled: false)
      @fake_organization.stubs(:auth_username_password_enabled).returns(false)
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 404
    end

    it 'returns 200 for organizations without signup_page_enabled but with a valid invitation' do
      @fake_organization = FactoryGirl.create(:organization_with_users, whitelisted_email_domains: [])
      owner = Carto::User.find(@fake_organization.owner.id)
      invitation = Carto::Invitation.create_new(owner, ['wadus@wad.us'], 'Welcome!', false)
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url(invitation_token: invitation.token('wadus@wad.us'), email: 'wadus@wad.us')
      response.status.should == 200
    end

    it 'returns user error with admin mail if organization has not enough seats' do
      fake_owner = FactoryGirl.build(:valid_user)
      @fake_organization = FactoryGirl.create(:organization_whitelist_carto, seats: 0, owner: fake_owner)
      Organization.stubs(:where).returns([@fake_organization])
      get signup_url
      response.status.should == 200
      response.body.should include("organization not enough seats")
      response.body.should include("contact the administrator of #{@fake_organization.name}</a>")
      response.body.should match(Regexp.new @fake_organization.owner.email)
    end

    it 'does not return an error if organization has no unassigned_quota left but the invited user is a viewer' do
      email = 'viewer_user@whatever.com'
      @organization.quota_in_bytes = @organization.assigned_quota
      @organization.save
      user = Carto::User.find(@org_user_owner.id)
      invitation = Carto::Invitation.create_new(user, [email], 'W!', true)
      invitation.save
      token = invitation.token(email)

      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)

      host! "#{@organization.name}.localhost.lan"
      get signup_organization_user_url(user_domain: @organization.name,
                                       user: { username: 'viewer-user',
                                               email: email,
                                               password: '2{Patrañas}' },
                                               invitation_token: token)

      response.status.should == 200
      response.body.should_not include("quota_in_bytes not enough disk quota")
    end

    it 'returns an error if organization has no unassigned_quota and invited user is not a viewer' do
      email = 'viewer_user@whatever.com'
      @organization.quota_in_bytes = @organization.assigned_quota
      @organization.whitelisted_email_domains = ['whatever.com']
      @organization.save
      user = Carto::User.find(@org_user_owner.id)
      invitation = Carto::Invitation.create_new(user, [email], 'W!', false)
      invitation.save
      token = invitation.token(email)

      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)

      host! "#{@organization.name}.localhost.lan"
      get signup_organization_user_url(user_domain: @organization.name,
                                       user: { username: 'viewer-user',
                                               email: email,
                                               password: '2{Patrañas}' },
                                               invitation_token: token)

      response.status.should == 200
      response.body.should include("quota_in_bytes not enough disk quota")
    end

    it 'signs user up as viewer even if all non-viewer seats are taken' do
      @fake_organization = FactoryGirl.create(:organization_with_users, whitelisted_email_domains: [])
      @fake_organization.seats = @fake_organization.builder_users.count(&:builder?)
      @fake_organization.viewer_seats = 10
      @fake_organization.save
      owner = Carto::User.find(@fake_organization.owner.id)
      invitation = Carto::Invitation.create_new(owner, ['wadus@wad.us'], 'Welcome!', true)
      host! "#{@fake_organization.name}.localhost.lan"
      get signup_url(invitation_token: invitation.token('wadus@wad.us'), email: 'wadus@wad.us')
      response.status.should == 200
    end
  end

  describe 'user creation' do
    include_context 'organization with users helper'

    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      @organization.whitelisted_email_domains = ['carto.com']
      @organization.default_quota_in_bytes = DEFAULT_QUOTA_IN_BYTES
      @organization.save

      @org_2_user_owner = TestUserFactory.new.create_owner(@organization_2)
    end

    before(:each) do
      @organization.auth_username_password_enabled = true
      @organization.auth_google_enabled = true
      @organization.strong_passwords_enabled = true
      @organization.save
    end

    it 'triggers validation error and not a NewUser job if email is not valid' do
      ::Resque.expects(:enqueue).never

      username = unique_name('user')
      email = 'testemail@nonono.com'
      password = '2{Patrañas}'
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, user: { username: username, email: email, password: password })
      response.status.should == 422
      Carto::UserCreation.where(username: username).any?.should be_false
    end

    it 'triggers validation error and not a NewUser job if username is too long' do
      ::Resque.expects(:enqueue).never

      name = 'sixtythreecharacterslongiswaytoomanycharactersmatewhydoyoueventry'
      email = "testemail@#{@organization.whitelisted_email_domains[0]}"
      password = '12345678'
      user = { username: name, email: email, password: password }
      org_name = @organization.name
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: org_name, user: user)
      response.status.should == 422
      Carto::UserCreation.where(username: name).any?.should be_false
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

    it 'trigger creation if mail is whitelisted with wildcard' do
      @organization.whitelisted_email_domains = ['*.carto.com']
      @organization.save
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser,
                                      instance_of(String), anything, instance_of(FalseClass)).returns(true)
      username = 'testusername'
      email = "testemail@a.carto.com"
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
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_user_owner.id), [invited_email], 'W!', false)
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
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_2_user_owner.id), [invited_email], 'W!', false)
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
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_user_owner.id), [invited_email], 'W!', false)
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

    it 'triggers a viewer creation that creates a viewer user' do
      invited_email = 'viewer_user@whatever.com'
      invitation = Carto::Invitation.create_new(Carto::User.find(@org_user_owner.id), [invited_email], 'W!', true)
      invitation.save
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      ::Resque.expects(:enqueue).
        with(::Resque::UserJobs::Signup::NewUser, instance_of(String), anything, instance_of(FalseClass)).
        returns(true)

      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name,
                                        user: { username: 'viewer-user',
                                                email: invited_email,
                                                password: '2{Patrañas}' },
                                        invitation_token: invitation.token(invited_email))
      last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
      last_user_creation.next_creation_step until last_user_creation.finished?

      last_user_creation.state.should eq 'success'
      last_user_creation.viewer.should be_true
      last_user_creation.user.viewer.should be_true
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

        post signup_organization_user_url(user_domain: @organization.name, user: { username: 'whatever', email: 'whatever@carto.com', password: 'whatever' })
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
