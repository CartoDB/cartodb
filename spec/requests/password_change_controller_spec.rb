require_relative '../spec_helper'

describe PasswordChangeController do

  before(:each) do
    User.any_instance.stubs(:update_in_central).returns(true)
    PasswordChangeController.any_instance.stubs(:check_password_expired)
    @user = create(:user)
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

  let (:payload_password_not_changed) do
    {
      username: @user.username,
      old_password: @user.password,
      password: @user.password,
      password_confirmation: @user.password
    }
  end

  let (:payload_password_short) do
    {
      username: @user.username,
      old_password: @user.password,
      password: '123',
      password_confirmation: '123'
    }
  end

  describe('#update') do
    it 'show errors if old_password is wrong' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_wrong_old_password, @headers
      response.status.should == 200
      response.body.should include 'Please ensure you typed the password correctly'
      request.path.should eq password_change_path(@user.username)
    end

    it 'show errors if new passwords mismatch' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_mismatch_new_password, @headers
      response.status.should == 200
      response.body.should include 'Please ensure your passwords match'
      request.path.should eq password_change_path(@user.username)
    end

    it 'show errors if password is unchanged' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_password_not_changed, @headers
      response.status.should == 200
      response.body.should include 'Must be different than current password'
    end

    it 'show errors if password is too short' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_password_short, @headers
      response.status.should == 200
      response.body.should include 'must be at least'
    end

    it 'changes password' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_ok, @headers

      @user.reload.last_password_change_date.should be
    end

    it 'does not require to authenticate again' do
      login_as(@user, scope: @user.username)

      PasswordChangeController.any_instance.expects(:authenticate!).never

      put password_change_url(@user.username), payload_ok, @headers
    end

    it 'redirects to dashboard by default' do
      login_as(@user, scope: @user.username)

      put password_change_url(@user.username), payload_ok, @headers

      follow_redirect!
      request.path.should eq dashboard_path
    end
  end
end
