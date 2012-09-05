# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Superadmin's users API" do

  background do
    Capybara.current_driver = :rack_test
    @new_user = new_user(:password => "this_is_a_password")
    @user_atts = @new_user.values
  end

  scenario "Http auth is needed" do
    post_json superadmin_users_path, { :format => "json" } do |response|
      response.status.should == 401
    end
  end

  scenario "user create fail" do
    @user_atts[:email] = nil

    post_json superadmin_users_path, { :user => @user_atts }, default_headers do |response|
      response.status.should == 422
      response.body[:errors]['email'].should be_present
      response.body[:errors]['email'].should include("is not present")
    end
  end

  scenario "user create with password success" do
    @user_atts.delete(:crypted_password)
    @user_atts.delete(:salt)
    @user_atts.merge!(:password => "this_is_a_password")

    post_json superadmin_users_path, { :user => @user_atts }, default_headers do |response|
      response.status.should == 201
      response.body[:email].should == @user_atts[:email]
      response.body[:username].should == @user_atts[:username]
      response.body.should_not have_key(:crypted_password)
      response.body.should_not have_key(:salt)

      # Double check that the user has been created properly
      user = User.filter(:email => @user_atts[:email]).first
      user.should be_present
      user.id.should == response.body[:id]
      User.authenticate(user.username, "this_is_a_password").should == user
    end
  end

  scenario "user create with crypted_password and salt success" do
    post_json superadmin_users_path, { :user => @user_atts }, default_headers do |response|
      response.status.should == 201
      response.body[:email].should == @user_atts[:email]
      response.body[:username].should == @user_atts[:username]
      response.body.should_not have_key(:crypted_password)
      response.body.should_not have_key(:salt)

      # Double check that the user has been created properly
      user = User.filter(:email => @user_atts[:email]).first
      user.should be_present
      user.id.should == response.body[:id]
      User.authenticate(user.username, "this_is_a_password").should == user
    end
  end

  scenario "user create default account settings" do
    @user_atts[:private_tables_enabled] = false
    post_json superadmin_users_path, { :user => @user_atts }, default_headers do |response|
      response.status.should == 201
      response.body[:quota_in_bytes].should == 104857600
      response.body[:table_quota].should == 5
      response.body[:account_type].should == 'FREE'
      response.body[:private_tables_enabled].should == false

      # Double check that the user has been created properly
      user = User.filter(:email => @user_atts[:email]).first
      user.quota_in_bytes.should == 104857600
      user.table_quota.should == 5
      user.account_type.should == 'FREE'
      user.private_tables_enabled.should == false
    end
  end


  scenario "user create non-default account settings" do
    @user_atts[:quota_in_bytes] = 2000
    @user_atts[:table_quota]    = 20
    @user_atts[:account_type]   = 'Juliet'
    @user_atts[:private_tables_enabled] = true

    post_json superadmin_users_path, { :user => @user_atts }, default_headers do |response|
      response.status.should == 201
      response.body[:quota_in_bytes].should == 2000
      response.body[:table_quota].should == 20
      response.body[:account_type].should == 'Juliet'
      response.body[:private_tables_enabled].should == true

      # Double check that the user has been created properly
      user = User.filter(:email => @user_atts[:email]).first
      user.quota_in_bytes.should == 2000
      user.table_quota.should == 20
      user.account_type.should == 'Juliet'
      user.private_tables_enabled.should == true
    end
  end


  scenario "update user account details" do
    user = create_user
    @update_atts = {:quota_in_bytes => 2000,
                    :table_quota    => 20,
                    :account_type   => 'Juliet',
                    :private_tables_enabled => true}

    # test to true
    put_json superadmin_user_path(user), { :user => @update_atts }, default_headers do |response|
      response.status.should == 204
    end
    user = User[user.id]
    user.quota_in_bytes.should == 2000
    user.table_quota.should == 20
    user.account_type.should == 'Juliet'
    user.private_tables_enabled.should == true

    # then test back to false
    put_json superadmin_user_path(user), { :user => {:private_tables_enabled => false} }, default_headers do |response|
      response.status.should == 204
    end
    user = User[user.id]
    user.private_tables_enabled.should == false
  end


  scenario "user update fail" do
    user = create_user

    put_json superadmin_user_path(user), { :user => { :email => "" } }, default_headers do |response|
      response.status.should == 422
    end
  end

  scenario "user update success" do
    user = create_user
    put_json superadmin_user_path(user), { :user => { :email => "newmail@test.com" } }, default_headers do |response|
      response.status.should == 204
    end
    user = User[user.id]
    user.email.should == "newmail@test.com"
  end

  scenario "user delete success" do
    user = create_user
    delete_json superadmin_user_path(user), default_headers do |response|
      response.status.should == 204
    end
    User[user.id].should be_nil
  end

  private

  def default_headers(user = Cartodb.config[:superadmin]["username"], password = Cartodb.config[:superadmin]["password"])
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(user, password),
      'HTTP_ACCEPT' => "application/json"
    }
  end
end
