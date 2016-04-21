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
    delete_user_data @user1 if @user1
    delete_user_data @user2 if @user2
    # User destruction is handled at spec_helper
  end
end

shared_context 'user helper' do
  before(:all) do
    username = "a#{String.random(10)}-a".downcase
    @user = create_user(email: "#{username}@cartotest.com", username: username, password: '123456')
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
