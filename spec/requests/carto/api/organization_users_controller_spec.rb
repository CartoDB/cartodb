# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/organizations_controller'

describe Carto::Api::OrganizationUsersController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before (:each) do
    ::User.any_instance.stubs(:validate_credentials_not_taken_in_central).returns(true)
    ::User.any_instance.stubs(:create_in_central).returns(true)
    ::User.any_instance.stubs(:update_in_central).returns(true)
    ::User.any_instance.stubs(:delete_in_central).returns(true)
    ::User.any_instance.stubs(:load_common_data).returns(true)
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

      params = { username: "#{random_username}", password: 'patata' }
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
      params = { username: "#{username}", email: "#{username}@cartodb.com" }
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should == 410
      last_response.body.include?('password is not present').should be true
    end

    it 'correctly creates a user' do
      login(@organization.owner)
      username = 'manolo-escobar'
      params = { username: "#{username}",
                 email: "#{username}@cartodb.com",
                 password: 'patata',
                 soft_geocoding_limit: false,
                 quota_in_bytes: 1024 }
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should == 200

      last_user_created = @organization.users.find { |user| user.username == username }
      last_user_created.username.should == username
      last_user_created.email.should == "#{username}@cartodb.com"
      last_user_created.soft_geocoding_limit.should == false
      last_user_created.quota_in_bytes.should == 1024
      last_user_created.destroy
    end

    it 'assigns soft_geocoding_limit to false by default' do
      login(@organization.owner)
      username = 'soft-geocoding-limit-false-user'
      params = { username: "#{username}",
                 email: "#{username}@cartodb.com",
                 password: 'patata',
                 quota_in_bytes: 1024 }
      post api_v1_organization_users_create_url(name: @organization.name), params

      last_response.status.should == 200

      @organization.reload
      last_user_created = @organization.users.find { |user| user.username == username }
      last_user_created.soft_geocoding_limit.should == false
      last_user_created.destroy
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

      user_to_update = @organization.users[0]
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username)

      last_response.status.should == 410
      last_response.body.include?('No update params provided').should be true
    end

    it 'should update password' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      params = { password: 'limonero' }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      last_response.status.should == 200
    end

    it 'should update email' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      params = { email: new_email }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].email.should == new_email
    end

    it 'should update quota_in_bytes' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      params = { quota_in_bytes: 2048 }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].quota_in_bytes.should == 2048
    end

    it 'should update soft_geocoding_limit' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      params = { soft_geocoding_limit: true }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].soft_geocoding_limit.should be true

      params = { soft_geocoding_limit: false }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].soft_geocoding_limit.should be false
    end

    it 'should do full update' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      params = { email: new_email,
                 password: 'pataton',
                 soft_geocoding_limit: true,
                 quota_in_bytes: 2048 }
      put api_v1_organization_users_update_url(name: @organization.name, u_username: user_to_update.username), params

      @organization.reload
      @organization.users[0].reload

      last_response.status.should == 200

      @organization.users[0].email.should == new_email
      @organization.users[0].soft_geocoding_limit.should be true
      @organization.users[0].quota_in_bytes.should == 2048
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

      user_to_be_deleted = @organization.users[0].dup
      delete api_v1_organization_users_delete_url(name: @organization.name, u_username: user_to_be_deleted.username)

      last_response.status.should == 200

      @organization.reload
      @organization.users.map(&:id).include?(user_to_be_deleted.id).should eq false
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

      user_to_be_shown = @organization.users[0].dup
      get api_v1_organization_users_show_url(name: @organization.name, u_username: user_to_be_shown.username)

      last_response.status.should == 200
      last_response.body == Carto::Api::UserPresenter.new(user_to_be_shown, current_viewer: @organization.owner).to_poro
    end
  end
end
