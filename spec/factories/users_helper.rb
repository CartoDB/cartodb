shared_context 'users helper' do
  include_context 'database configuration'

  before(:each) do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  before(:all) do
    @user1 = FactoryGirl.create(:valid_user, private_tables_enabled: true)
    @carto_user1 = Carto::User.find(@user1.id)
    @user2 = FactoryGirl.create(:valid_user, private_tables_enabled: true)
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user1
    delete_user_data @user2
  end

  after(:all) do
    bypass_named_maps
    @user1.destroy if @user1
    @user2.destroy if @user2
  end
end

shared_context 'user helper' do
  before(:all) do
    @user = FactoryGirl.create(:valid_user)
    @carto_user = Carto::User.find(@user.id)
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  before(:each) do
    bypass_named_maps
    delete_user_data(@user)
  end
end
