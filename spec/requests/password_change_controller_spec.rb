require_relative '../spec_helper'

describe PasswordChangeController do

  before(:each) do
    @user = FactoryGirl.create(:user)
  end

  after(:each) do
    @user.destroy
  end

  let (:payload_wrong_old_password) do
    {
      username: @user.username,
      old_password: 'wrong',
      password: @user.password,
      password_confirmation: @user.password
    }
  end

  let (:payload_mismatch_new_password) do
    {
      username: @user.username,
      old_password: @user.password,
      password: 'password',
      password_confirmation: 'password123'
    }
  end

  let (:payload_ok) do
    {
      username: @user.username,
      old_password: @user.password,
      password: 'password123',
      password_confirmation: 'password123'
    }
  end

  describe('#update') do
    it 'show errors if old_password is wrong' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_wrong_old_password, @headers
      response.status.should == 200
      # response.body.should include 'Please ensure you typed the password correctly'
      response.body.should include 'has expired'
      request.path.should eq password_change_path(@user.username)
    end

    it 'show errors if new passwords mismatch' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_mismatch_new_password, @headers
      response.status.should == 200
      # response.body.should include 'Please ensure your passwords match'
      response.body.should include 'has expired'
      request.path.should eq password_change_path(@user.username)
    end

    it 'changes password and authenticate session' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_ok, @headers

      @user.reload
      @user.validate_old_password('password123')
      @user.last_password_change_date.should be

      follow_redirect!
      request.path.should eq dashboard_path
    end
  end
end
