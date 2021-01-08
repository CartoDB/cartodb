require_relative '../../spec_helper'
require_relative '../../../app/models/carto/user_creation'

describe Carto::UserCreation do

  describe 'autologin?' do

    it 'is true for autologin_user_creation factory' do
      FactoryGirl.build(:autologin_user_creation).autologin?.should == true
    end

    it 'is false for states other than success' do
      FactoryGirl.build(:autologin_user_creation, state: 'creating_user').autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, state: 'validating_user').autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, state: 'saving_user').autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, state: 'promoting_user').autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, state: 'creating_user_in_central').autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, state: 'load_common_data').autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, state: 'failure').autologin?.should == false

      FactoryGirl.build(:autologin_user_creation, state: 'success').autologin?.should == true
    end

    it 'is stops working after one minute' do
      FactoryGirl.build(:autologin_user_creation, created_at: Time.now - 61.seconds).autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, created_at: Time.now - 60.seconds).autologin?.should == false
      FactoryGirl.build(:autologin_user_creation, created_at: Time.now - 59.seconds).autologin?.should == true
    end

    it 'is false for users with enable_account_token' do
      user_creation = FactoryGirl.build(:autologin_user_creation)
      user = user_creation.instance_variable_get(:@cartodb_user)
      user.enable_account_token = 'whatever'
      user_creation.autologin?.should == false
    end

    it 'is false for disabled users' do
      user_creation = FactoryGirl.build(:autologin_user_creation)
      user = user_creation.instance_variable_get(:@cartodb_user)
      user.enabled = false
      user_creation.autologin?.should == false
    end

    it 'is false for users that have seen their dashboard' do
      user_creation = FactoryGirl.build(:autologin_user_creation)
      user = user_creation.instance_variable_get(:@cartodb_user)
      user.dashboard_viewed_at = Time.now
      user_creation.autologin?.should == false
    end

  end

  describe 'validation token' do
    include_context 'organization with users helper'

    before(:each) do
      # Disable central for these tests
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(false)
    end

    after(:all) do
      Cartodb::Central.unstub(:sync_data_with_cartodb_central?)
    end

    it 'assigns an enable_account_token if user has not signed up with Google' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.enable_account_token.should_not be_nil
    end

    it 'does not assign an enable_account_token if user has signed up with Google' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = true

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.username.should == user_data.username
      saved_user.enable_account_token.should be_nil
    end

    it 'does not assign an enable_account_token if user has signed up with GitHub' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.github_user_id = 123

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.username.should == user_data.username
      saved_user.enable_account_token.should be_nil
    end

    it 'does not assign an enable_account_token nor sends email if user had an invitation and the right token is set' do
      expect(::Resque).to receive(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never
      expect(::Resque).to receive(:enqueue).with(Resque::OrganizationJobs::Mail::Invitation, instance_of(String)).once
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      invitation = Carto::Invitation.create_new(@carto_org_user_owner, [user_data.email], 'Welcome!', false)
      invitation.save

      user_creation = Carto::UserCreation.
                      new_user_signup(user_data).
                      with_invitation_token(invitation.token(user_data.email))
      user_creation.next_creation_step until user_creation.finished?
      user_creation.reload

      saved_user = user_creation.user
      saved_user.username.should == user_data.username
      saved_user.enable_account_token.should be_nil
    end

    it 'does create an account if user had and invitation' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)

      user_data = FactoryGirl.build(
        :valid_user,
        organization: @organization,
        google_sign_in: false
      )

      invitation = Carto::Invitation.create_new(@carto_org_user_owner,
                                                [user_data.email],
                                                'Welcome!',
                                                false)
      invitation.save

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.with_invitation_token(invitation.token(user_data.email))
      user_creation.save

      user_creation = Carto::UserCreation.find(user_creation.id)
      user_creation.next_creation_step! until user_creation.finished?
      user_creation.reload

      user_creation.state.should eq('success')
    end

    it 'does create an account if user had multiple invitations' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)

      user_data = FactoryGirl.build(
        :valid_user,
        organization: @organization,
        google_sign_in: false
      )

      # Dismissed invitations
      4.times do
        Carto::Invitation.create_new(
          @carto_org_user_owner, [user_data.email], 'Welcome!', false
        ).save
      end

      invitation = Carto::Invitation.create_new(@carto_org_user_owner,
                                                [user_data.email], 'Welcome!',
                                                false)
      invitation.save

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.with_invitation_token(invitation.token(user_data.email))
      user_creation.save

      user_creation = Carto::UserCreation.find(user_creation.id)
      user_creation.next_creation_step! until user_creation.finished?
      user_creation.reload

      user_creation.state.should eq('success')
    end

    it 'with viewer invitations creates viewer users' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      user_data = FactoryGirl.build(:valid_user, organization: @organization, google_sign_in: false)

      invitation = Carto::Invitation.create_new(@carto_org_user_owner, [user_data.email], 'Welcome!', true)
      invitation.save

      user_creation = Carto::UserCreation.
                      new_user_signup(user_data).
                      with_invitation_token(invitation.token(user_data.email))
      user_creation.next_creation_step until user_creation.finished?
      user_creation.reload

      user_creation.user.viewer.should eq true
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if saving fails' do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(false)
      allow_any_instance_of(::User).to receive(:save).and_raise('saving error')

      expect(::Resque).to receive(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = true

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.where(username: user_data.username).first
      saved_user.should == nil

      user_creation.reload
      user_creation.state.should == 'failure'
    end

    after(:each) do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(false)
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if Central fails' do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(true)
      allow_any_instance_of(::User).to receive(:create_in_central).and_raise('Error on state creating_user_in_central, mark_as_failure: false. Error: Application server responded with http 422: {"errors":["Existing username."]}')

      expect(::Resque).to receive(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = true

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.where(username: user_data.username).first
      saved_user.should == nil

      user_creation.reload
      user_creation.state.should == 'failure'
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if Central has a registered user matching username' do
      user = prepare_fake_central_user
      # This tests only matching usernames
      user.email = 'other@whatever.com'

      expect(::Resque).to receive(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

      user.organization = @organization

      user_creation = Carto::UserCreation.new_user_signup(user)
      user_creation.next_creation_step until user_creation.finished?

      Carto::User.where(username: user.username).first.should == nil

      user_creation.reload
      user_creation.state.should == 'failure'
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if Central has a registered user matching email' do
      user = prepare_fake_central_user
      # This tests only matching emails
      user.username = 'other_whatever'

      expect(::Resque).to receive(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

      user.organization = @organization

      user_creation = Carto::UserCreation.new_user_signup(user)
      user_creation.next_creation_step until user_creation.finished?

      Carto::User.where(username: user.username).first.should == nil

      user_creation.reload
      user_creation.state.should == 'failure'
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if username es empty' do
      user = prepare_fake_central_user
      # This tests only matching emails
      user.username = nil

      expect(::Resque).to receive(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

      user.organization = @organization

      expect {
        user_creation = Carto::UserCreation.new_user_signup(user)
      }.to raise_error
    end

    def prepare_fake_central_user
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(true)
      fake_central_client = {}
      allow(fake_central_client).to receive(:create_organization_user).and_return(true)
      allow_any_instance_of(::User).to receive(:cartodb_central_client).and_return(fake_central_client)
      allow(Cartodb::Central).to receive(:new).and_return(fake_central_client)
      user = FactoryGirl.build(:valid_user)
      central_user_data = JSON.parse(user.to_json)
      # Central doesn't return exactly the same attributes, but this is good enough for testing
      allow_any_instance_of(Cartodb::Central).to receive(:get_user).and_return(central_user_data)
      allow(fake_central_client).to receive(:get_user).and_return(central_user_data)
      user
    end
  end

  describe 'validation email' do
    include_context 'organization with users helper'

    # INFO : this mail contains validation link
    it 'triggers a ::Resque::UserJobs::Mail::NewOrganizationUser' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect(::Resque).to receive(:enqueue).with(Resque::UserJobs::Mail::NewOrganizationUser, instance_of(String)).once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end

    it 'should trigger load_common_data in the user if common_data_url is setted' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect_any_instance_of(::User).to receive(:load_common_data).with('http://www.example.com').once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.set_common_data_url("http://www.example.com")
      user_creation.next_creation_step until user_creation.finished?
    end

    it 'should not trigger load_common_data in the user if common_data_url is not setted' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect_any_instance_of(::User).to receive(:load_common_data).with('http://www.example.com').never

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end

    it 'should send invitation email but not validation email if user is created via API' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect(::Resque).to receive(:enqueue).with(Resque::OrganizationJobs::Mail::Invitation, instance_of(String)).never
      expect(::Resque).to receive(:enqueue).with(Resque::UserJobs::Mail::NewOrganizationUser, instance_of(String)).once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization

      user_creation = Carto::UserCreation.new_user_signup(user_data, Carto::UserCreation::CREATED_VIA_API)
      user_creation.next_creation_step until user_creation.finished?
    end
  end

  describe 'organization overquota email' do
    include_context 'organization with users helper'

    it 'triggers a DiskQuotaLimitReached mail if organization has run out of quota for new users' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect(::Resque).to receive(:enqueue).with(Resque::UserJobs::Mail::NewOrganizationUser, instance_of(String)).once
      expect(::Resque).to receive(:enqueue).with(Resque::OrganizationJobs::Mail::DiskQuotaLimitReached, instance_of(String)).once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      @organization.quota_in_bytes = @organization.assigned_quota + @organization.default_quota_in_bytes + 1
      @organization.save

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end
  end

  describe 'organization over seats email' do
    include_context 'organization with users helper'

    it 'triggers a SeatLimitReached mail if organization has run out of seats new users' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect(::Resque).to receive(:enqueue).with(Resque::UserJobs::Mail::NewOrganizationUser, instance_of(String)).once
      expect(::Resque).to receive(:enqueue).with(Resque::OrganizationJobs::Mail::SeatLimitReached, instance_of(String)).once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      @organization.seats = 4
      @organization.save

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end

    it 'doesnt trigger any unexpected mails if organization is ok' do
      allow_any_instance_of(::User).to receive(:create_in_central).and_return(true)
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      expect(::Resque).to receive(:enqueue).with(Resque::UserJobs::Mail::NewOrganizationUser, instance_of(String)).once
      expect(::Resque).to receive(:enqueue).with(Resque::OrganizationJobs::Mail::SeatLimitReached, instance_of(String)).never
      expect(::Resque).to receive(:enqueue).with(Resque::OrganizationJobs::Mail::DiskQuotaLimitReached, instance_of(String)).never

      user_data = FactoryGirl.build(:valid_user)

      user_data.organization = @organization
      @organization.seats = 15
      @organization.save

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end
  end

  describe '#initialize_user' do
    it 'initializes users with http_authentication without organization' do
      created_via = Carto::UserCreation::CREATED_VIA_HTTP_AUTENTICATION
      user = FactoryGirl.build(:valid_user)
      user.organization_id.should == nil
      user_creation = Carto::UserCreation.new_user_signup(user, created_via)
      initialized_user = user_creation.send(:initialize_user)
      initialized_user.should_not be_nil
      initialized_user.organization_id.should be_nil
    end
  end

  describe 'state machine' do
    before(:each) do
      allow_any_instance_of(CartoDB::UserModule::DBService).to receive(:enable_remote_db_user).and_return(true)
      created_via = Carto::UserCreation::CREATED_VIA_HTTP_AUTENTICATION
      user = FactoryGirl.build(:valid_user)
      @user_creation = Carto::UserCreation.new_user_signup(user, created_via)
    end

    after(:each) do
      @user_creation.user.destroy
    end

    def creation_steps(user_creation)
      states = [user_creation.state]
      until user_creation.finished?
        user_creation.next_creation_step
        states << user_creation.state
      end

      states
    end

    it 'with Central and builder, does all the steps' do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(true)
      allow_any_instance_of(User).to receive(:validate_credentials_not_taken_in_central).and_return(true)
      expect(@user_creation).to receive(:create_in_central).once
      expect(@user_creation).to receive(:load_common_data).once

      creation_steps(@user_creation).should eq ["enqueuing", "creating_user", "validating_user", "saving_user",
                                                "promoting_user", "creating_user_in_central", "load_common_data",
                                                "success"]
    end

    it 'without Central, skips creation in central' do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(false)
      expect(@user_creation).to receive(:create_in_central).never
      expect(@user_creation).to receive(:load_common_data).once

      creation_steps(@user_creation).should eq ["enqueuing", "creating_user", "validating_user", "saving_user",
                                                "promoting_user", "load_common_data", "success"]
    end

    it 'with Central as a viewer, skips loading common data' do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(true)
      allow_any_instance_of(User).to receive(:validate_credentials_not_taken_in_central).and_return(true)
      @user_creation.viewer = true
      expect(@user_creation).to receive(:create_in_central).once
      expect(@user_creation).to receive(:load_common_data).never

      creation_steps(@user_creation).should eq ["enqueuing", "creating_user", "validating_user", "saving_user",
                                                "promoting_user", "creating_user_in_central", "success"]
    end

    it 'without Central as a viewer, skips loading common data and creation in central' do
      allow(Cartodb::Central).to receive(:sync_data_with_cartodb_central?).and_return(false)
      @user_creation.viewer = true
      expect(@user_creation).to receive(:create_in_central).never
      expect(@user_creation).to receive(:load_common_data).never

      creation_steps(@user_creation).should eq ["enqueuing", "creating_user", "validating_user", "saving_user",
                                                "promoting_user", "success"]
    end
  end
end
