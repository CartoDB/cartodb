require_relative '../../spec_helper'
require_relative '../../../app/models/carto/user_creation'

describe Carto::UserCreation do

  describe 'validation token' do
    include_context 'organization with users helper'

    it 'assigns an enable_account_token if user has not signed up with Google' do
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:enable_remote_db_user).returns(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.enable_account_token.should_not be_nil
    end

    it 'does not assign an enable_account_token if user has signed up with Google' do
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:enable_remote_db_user).returns(true)
      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = true

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.username.should == user_data.username
      saved_user.enable_account_token.should be_nil
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if saving fails' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
      User.any_instance.stubs(:save).raises('saving error')

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

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
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(false)
    end

    it 'neither creates a new User nor sends the mail and marks creation as failure if Central fails' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      User.any_instance.stubs(:create_in_central).raises('Error on state creating_user_in_central, mark_as_failure: false. Error: Application server responded with http 422: {"errors":["Existing username."]}')

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

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

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

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

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

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

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser).never

      user.organization = @organization

      expect {
        user_creation = Carto::UserCreation.new_user_signup(user)
      }.to raise_error
    end

    def prepare_fake_central_user
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      fake_central_client = {}
      fake_central_client.stubs(:create_organization_user).returns(true)
      User.any_instance.stubs(:cartodb_central_client).returns(fake_central_client)
      Cartodb::Central.stubs(:new).returns(fake_central_client)
      user = FactoryGirl.build(:valid_user)
      central_user_data = JSON.parse(user.to_json)
      # Central doesn't return exactly the same attributes, but this is good enough for testing
      Cartodb::Central.any_instance.stubs(:get_user).returns(central_user_data)
      fake_central_client.stubs(:get_user).returns(central_user_data)
      user
    end
  end

  describe 'validation email' do
    include_context 'organization with users helper'

    # INFO : this mail contains validation link
    it 'triggers a ::Resque::UserJobs::Mail::NewOrganizationUser' do
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:enable_remote_db_user).returns(true)
      ::Resque.expects(:enqueue).with(Resque::UserJobs::Mail::NewOrganizationUser, instance_of(String)).once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end

    it 'should trigger load_common_data in the user if common_data_url is setted' do
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:enable_remote_db_user).returns(true)
      User.any_instance.expects(:load_common_data).with('http://www.example.com').once

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.set_common_data_url("http://www.example.com")
      user_creation.next_creation_step until user_creation.finished?
    end

    it 'should not trigger load_common_data in the user if common_data_url is not setted' do
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:enable_remote_db_user).returns(true)
      User.any_instance.expects(:load_common_data).with('http://www.example.com').never

      user_data = FactoryGirl.build(:valid_user)
      user_data.organization = @organization
      user_data.google_sign_in = false

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?
    end

  end

end
