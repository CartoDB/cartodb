require_relative '../spec_helper_min'

describe PasswordResetsController do

  before(:all) do
    User.any_instance.stubs(:update_in_central).returns(true)
    @user = create(:user)
  end

  after(:each) do
    @user.password_reset_token = nil
    @user.password_reset_sent_at = nil
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  describe('#create') do
    it 'shows an error if the email is blank' do
      payload = { email: '' }

      post create_password_reset_path, payload, @headers

      response.status.should == 200
      response.body.should include "Email cannot be blank"
      request.path.should eq create_password_reset_path
    end

    it 'redirects to the right page if the email does not exist' do
      payload = { email: 'notfound@example.com' }

      post create_password_reset_path, payload, @headers

      response.status.should == 302

      follow_redirect!
      request.path.should eq sent_password_reset_path
    end

    it 'updates the user password_reset_token and password_reset_sent_at' do
      payload = { email: @user.email }

      post create_password_reset_path, payload, @headers

      @user.reload
      @user.password_reset_token.should_not be_nil
      @user.password_reset_sent_at.should_not be_nil
    end

    it 'redirects to the right page' do
      payload = { email: @user.email }

      post create_password_reset_path, payload, @headers

      response.status.should == 302

      follow_redirect!
      request.path.should eq sent_password_reset_path
    end
  end

  describe('#update') do
    before(:each) do
      @user.password_reset_token = 'token'
      @user.password_reset_sent_at = Time.zone.now
      @user.save
    end

    it 'shows an error if the passwords do not match' do
      payload = { carto_user: { password: 'newpass', password_confirmation: 'other' } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      response.status.should == 200
      response.body.should include "Please ensure your passwords match"
    end

    it 'shows an error if the password is the username' do
      payload = { carto_user: { password: @user.username, password_confirmation: @user.username } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      response.status.should == 200
      response.body.should include "must be different than the user name"
    end

    it 'shows an error if the password is a common one' do
      payload = { carto_user: { password: 'galina', password_confirmation: 'galina' } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      response.status.should == 200
      response.body.should include "be a common password"
    end

    it 'shows an error if the password is not strong' do
      organization = mock
      organization.stubs(:strong_passwords_enabled).returns(true)
      organization.stubs(:color)
      organization.stubs(:avatar_url)
      Carto::User.any_instance.stubs(:organization).returns(organization)

      payload = { carto_user: { password: 'galinaa', password_confirmation: 'galinaa' } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      response.status.should == 200
      response.body.should include "must be at least 8 characters long"
      Carto::User.any_instance.unstub(:organization)
    end

    it 'redirects to the initial password reset view if the token has expired' do
      payload = { carto_user: { password: 'newpass', password_confirmation: 'other' } }

      Delorean.jump(49.hours) do
        put update_password_reset_path(id: @user.password_reset_token), payload, @headers
      end

      response.status.should == 302
      follow_redirect!
      request.path.should eq new_password_reset_path
    end

    it 'updates the user password' do
      original_password = @user.crypted_password
      payload = { carto_user: { password: 'newpass', password_confirmation: 'newpass' } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      @user.reload
      @user.crypted_password.should_not == original_password
    end

    it 'resets the password_reset_token' do
      @user.password_reset_token.should_not be_nil

      payload = { carto_user: { password: 'newpass2', password_confirmation: 'newpass2' } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      @user.reload
      @user.password_reset_token.should be_nil
    end

    it 'redirects to the right page' do
      payload = { carto_user: { password: 'newpass3', password_confirmation: 'newpass3' } }

      put update_password_reset_path(id: @user.password_reset_token), payload, @headers

      response.status.should == 302
      follow_redirect!
      request.path.should eq changed_password_reset_path
    end
  end
end
