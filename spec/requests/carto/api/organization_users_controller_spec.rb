# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/organizations_controller'

describe Carto::Api::OrganizationUsersController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  def soft_limits(user)
    [
      user.soft_geocoding_limit,
      user.soft_twitter_datasource_limit,
      user.soft_here_isolines_limit
    ]
  end

  def set_soft_limits(user, soft_limits)
    user.soft_geocoding_limit = soft_limits[0]
    user.soft_twitter_datasource_limit = soft_limits[1]
    user.soft_here_isolines_limit = soft_limits[2]
  end

  def replace_soft_limits(user, soft_limits)
    old_soft_limits = soft_limits(user)
    set_soft_limits(user, soft_limits)
    user.save
    old_soft_limits
  end

  def user_params_soft_limits(username, soft_limit)
    user_params(username,
                soft_geocoding_limit: soft_limit,
                soft_twitter_datasource_limit: soft_limit,
                soft_here_isolines_limit: soft_limit)
  end

  def user_params(username = nil,
                  soft_geocoding_limit: false,
                  soft_twitter_datasource_limit: nil,
                  soft_here_isolines_limit: nil)

    params = {
      password: 'patata',
      quota_in_bytes: 1024
    }
    unless username.nil?
      params[:username] = username
      params[:email] = "#{username}@cartodb.com"
    end
    params[:soft_geocoding_limit] = soft_geocoding_limit unless soft_geocoding_limit.nil?
    params[:soft_twitter_datasource_limit] = soft_twitter_datasource_limit unless soft_twitter_datasource_limit.nil?
    params[:soft_here_isolines_limit] = soft_here_isolines_limit unless soft_here_isolines_limit.nil?

    params
  end

  def verify_soft_limits(user, value)
    user.soft_geocoding_limit.should eq value
    user.soft_twitter_datasource_limit.should eq value
    user.soft_geocoding_limit.should eq value
  end

  before(:each) do
    ::User.any_instance.stubs(:validate_credentials_not_taken_in_central).returns(true)
    ::User.any_instance.stubs(:create_in_central).returns(true)
    ::User.any_instance.stubs(:update_in_central).returns(true)
    ::User.any_instance.stubs(:delete_in_central).returns(true)
    ::User.any_instance.stubs(:load_common_data).returns(true)
    ::User.any_instance.stubs(:reload_avatar).returns(true)
  end

  before(:each) do
    @old_soft_limits = soft_limits(@organization.owner)
  end

  after(:each) do
    set_soft_limits(@organization.owner, @old_soft_limits)
    @organization.owner.save
  end

  describe 'user creation' do
    it 'returns 401 for non authorized calls' do
      post api_v1_organization_users_create_url(name: @organization.name)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      post api_v1_organization_users_create_url(name: @organization.name)
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      post api_v1_organization_users_create_url(name: @organization.name)
      last_response.status.should == 410
    end

    it 'returns 410 if email is not present' do
      login(@organization.owner)

      params = { username: random_username, password: 'patata' }
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.body.include?('email is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if username is not present' do
      login(@organization.owner)

      params = { email: "#{random_username}@cartodb.com", password: 'patata' }
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.body.include?('username is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if password is not present' do
      login(@organization.owner)

      username = 'manolo'
      params = { username: username, email: "#{username}@cartodb.com" }
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should eq 410
      last_response.body.include?('password is not present').should be true
    end

    it 'correctly creates a user' do
      login(@organization.owner)
      username = 'manolo-escobar'
      params = user_params(username)
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should eq 200

      last_user_created = @organization.users.find { |user| user.username == username }
      last_user_created.username.should eq username
      last_user_created.email.should eq "#{username}@cartodb.com"
      last_user_created.soft_geocoding_limit.should eq false
      last_user_created.quota_in_bytes.should eq 1024
      last_user_created.destroy
    end

    it 'assigns soft_geocoding_limit to false by default' do
      login(@organization.owner)
      username = 'soft-geocoding-limit-false-user'
      params = user_params(username, soft_geocoding_limit: nil)
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |user| user.username == username }
      last_user_created.soft_geocoding_limit.should eq false
      last_user_created.destroy
    end

    it 'can enable soft geocoding_limit, twitter_datasource_limit and here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true])

      login(@organization.owner)
      username = 'soft-limits-true-user'
      params = user_params_soft_limits(username, true)

      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |user| user.username == username }

      verify_soft_limits(last_user_created, true)

      last_user_created.destroy
    end

    it 'can disable soft geocoding_limit, twitter_datasource_limit and here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true])

      login(@organization.owner)
      username = 'soft-limits-false-user'
      params = user_params_soft_limits(username, false)

      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |user| user.username == username }

      verify_soft_limits(last_user_created, false)

      last_user_created.destroy
    end

    it 'cannot enable soft geocoding_limit, twitter_datasource_limit or here_isolines_limit if owner has not them' do
      replace_soft_limits(@organization.owner, [false, false, false])

      login(@organization.owner)
      username = 'soft-limits-true-invalid-user'
      params = user_params_soft_limits(username, true)
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should eq 410
      errors = JSON.parse(last_response.body)
      errors.count.should eq 3

      @organization.reload
      @organization.users.find { |user| user.username == username }.should be_nil
    end

  end

  describe 'user update' do
    it 'returns 401 for non authorized calls' do
      put api_v1_organization_users_update_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      put api_v1_organization_users_update_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      put api_v1_organization_users_update_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 410
    end

    it 'should do nothing if no update params are provided' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username)

      last_response.status.should eq 410
      last_response.body.include?('No update params provided').should be true
    end

    it 'should update password' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { password: 'limonero' }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should == 200
    end

    it 'should update email' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      new_email = "new-#{user_to_update.email}"
      params = { email: new_email }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params
      last_response.status.should eq 200

      user_to_update.reload.email.should == new_email
    end

    it 'should update quota_in_bytes' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { quota_in_bytes: 2048 }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 200

      user_to_update.reload
      user_to_update.quota_in_bytes.should == 2048
    end

    it 'should update soft_geocoding_limit' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      params = { soft_geocoding_limit: true }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 200
      user_to_update.reload.soft_geocoding_limit.should be true

      params = { soft_geocoding_limit: false }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 200

      user_to_update.reload
      user_to_update.soft_geocoding_limit.should be false
    end

    it 'should do full update' do
      @organization.owner.soft_geocoding_limit = true
      @organization.owner.save

      login(@organization.owner)

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      params = { email: new_email,
                 password: 'pataton',
                 soft_geocoding_limit: true,
                 quota_in_bytes: 2048 }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 200

      user_to_update.reload

      user_to_update.email.should eq new_email
      user_to_update.soft_geocoding_limit.should be true
      user_to_update.quota_in_bytes.should == 2048
    end

    it 'can enable soft geocoding_limit, twitter_datasource_limit and here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true])

      login(@organization.owner)
      user_to_update = @organization.users[0]
      params = user_params_soft_limits(nil, true)

      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 200

      user_to_update.reload
      verify_soft_limits(user_to_update, true)
    end

    it 'can disable soft geocoding_limit, twitter_datasource_limit and here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true])

      login(@organization.owner)
      user_to_update = @organization.users[0]
      params = user_params_soft_limits(nil, false)

      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 200

      user_to_update.reload
      verify_soft_limits(user_to_update, false)
    end

    it 'cannot enable soft geocoding_limit, twitter_datasource_limit and here_isolines_limit if owner has not them' do
      replace_soft_limits(@organization.owner, [false, false, false])

      login(@organization.owner)
      user_to_update = @organization.users[0]
      replace_soft_limits(user_to_update, [false, false, false])
      params = user_params_soft_limits(nil, true)

      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should eq 410
      errors = JSON.parse(last_response.body)
      errors.count.should eq 3

      user_to_update.reload
      verify_soft_limits(user_to_update, false)
    end

  end

  describe 'user deletion' do
    it 'returns 401 for non authorized calls' do
      delete api_v1_organization_users_delete_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      delete api_v1_organization_users_delete_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'should delete users' do
      login(@organization.owner)

      user_to_be_deleted = @organization.non_owner_users[0]
      delete api_v1_organization_users_delete_url(name: @organization.name, u_username: user_to_be_deleted.username)

      last_response.status.should eq 200

      User[user_to_be_deleted.id].should be_nil
    end

    it 'should not allow to delete the org owner' do
      login(@organization.owner)

      user_to_be_deleted = @organization.owner
      delete api_v1_organization_users_delete_url(name: @organization.name, u_username: user_to_be_deleted.username)

      last_response.status.should == 401
    end
  end

  describe 'user show' do
    it 'returns 401 for non authorized calls' do
      get api_v1_organization_users_show_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      get api_v1_organization_users_show_url(name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'should return 404 for non existing users' do
      login(@organization.owner)

      get api_v1_organization_users_show_url(name: @organization.name, u_username: 'bogus-non-existent-user')

      last_response.status.should == 404
    end

    it 'should show existing users' do
      login(@organization.owner)

      @organization.reload
      user_to_be_shown = @organization.non_owner_users[0]
      get api_v1_organization_users_show_url(name: @organization.name, u_username: user_to_be_shown.username)

      last_response.status.should eq 200
      last_response.body == Carto::Api::UserPresenter.new(user_to_be_shown, current_viewer: @organization.owner).to_poro
    end
  end
end
