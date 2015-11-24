require_relative '../spec_helper'

shared_context 'users helper' do
  include_context 'database configuration'

  before(:each) do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  before(:all) do
    # TODO: Remove this and either all use the global instances or create a true general context with sample users
    @user1 = $user_1
    @user2 = $user_2
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user1
    delete_user_data @user2
  end

  after(:all) do
    bypass_named_maps
    delete_user_data @user1 if @user1
    delete_user_data @user2 if @user2
    # User destruction is handled at spec_helper
  end
end
