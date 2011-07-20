# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Superadmin's users administration" do

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

    basic_auth do
      post_json superadmin_users_path, { :user => @user_atts } do |response|
        response.status.should == 422
        response.body[:email].should be_present
        response.body[:email].should include("is not present")
      end
    end
  end

  scenario "user create with password success" do
    @user_atts.delete(:crypted_password)
    @user_atts.delete(:salt)
    @user_atts.merge!(:password => "this_is_a_password")
    basic_auth do
      post_json superadmin_users_path, { :user => @user_atts } do |response|
        response.status.should == 201
        response.body[:email].should == @user_atts[:email]
        response.body[:username].should == @user_atts[:username]
        response.body[:subdomain].should == @user_atts[:subdomain]
        response.body.should_not have_key(:crypted_password)
        response.body.should_not have_key(:salt)
        
        # Double check that the user has been created properly
        user = User.filter(:email => @user_atts[:email]).first
        user.should be_present
        user.id.should == response.body[:id]
        User.authenticate(user.username, "this_is_a_password").should == user
      end
    end
  end
  
  scenario "user create with crypted_password and salt success" do
    basic_auth do
      post_json superadmin_users_path, { :user => @user_atts } do |response|
        response.status.should == 201
        response.body[:email].should == @user_atts[:email]
        response.body[:username].should == @user_atts[:username]
        response.body[:subdomain].should == @user_atts[:subdomain]
        response.body.should_not have_key(:crypted_password)
        response.body.should_not have_key(:salt)
        
        # Double check that the user has been created properly
        user = User.filter(:email => @user_atts[:email]).first
        user.should be_present
        user.id.should == response.body[:id]
        User.authenticate(user.username, "this_is_a_password").should == user
      end
    end
  end
  
  scenario "user update fail" do
    user = create_user
    
    basic_auth do
      put_json superadmin_user_path(user), { :user => { :email => "" } } do |response|
        response.status.should == 422
      end
    end
  end
  
  scenario "user update success" do
    user = create_user
    basic_auth do
      put_json superadmin_user_path(user), { :user => { :email => "newmail@test.com" } } do |response|
        response.status.should == 200
      end
    end
    user = User[user.id]
    user.email.should == "newmail@test.com"
  end
  
  scenario "user delete success" do
    user = create_user
    basic_auth do
      delete_json superadmin_user_path(user) do |response|
        response.status.should == 200
      end
    end
    User[user.id].should be_nil
  end
  
  private
  
  # set http auth and json headers for request
  def basic_auth(user = APP_CONFIG[:superadmin]["username"], password = APP_CONFIG[:superadmin]["password"])
    header('AUTHORIZATION', ActionController::HttpAuthentication::Basic.encode_credentials(user, password))
    header('accept', "application/json")
    yield if block_given?
  end
end
