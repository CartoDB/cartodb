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

    it 'neither creates a new User nor sends the mail and marks creation as failure if Central fails' do
      Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
      User.any_instance.stubs(:create_in_central).raises('Error on state creating_user_in_central, mark_as_failure: false. Error: Application server responded with http 422: {"errors":["Existing username."]}')
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

  end

end
