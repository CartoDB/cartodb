# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/organizations_controller'

describe Carto::Api::OrganizationUsersController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  describe 'user creation' do
    it 'returns 401 for non authorized calls' do
      post api_v1_organization_users_create_url(id: @organization.id), @headers
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      post api_v1_organization_users_create_url(id: @organization.id), @headers
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      post api_v1_organization_users_create_url(id: @organization.id), @headers
      last_response.status.should == 410
    end

    it 'returns 410 if email is not present' do
      login(@organization.owner)

      post api_v1_organization_users_create_url(id: @organization.id,
                                                username: "#{random_username}",
                                                password: 'patata',
                                                password_confirmation: 'patata'),
           @headers

      last_response.body.include?('email is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if username is not present' do
      login(@organization.owner)

      post api_v1_organization_users_create_url(id: @organization.id,
                                                email: "#{random_username}@cartodb.com",
                                                password: 'patata',
                                                password_confirmation: 'patata'),
           @headers

      last_response.body.include?('username is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if password is not present' do
      login(@organization.owner)

      username = random_username
      post api_v1_organization_users_create_url(id: @organization.id,
                                                username: "#{username}",
                                                email: "#{username}@cartodb.com"),
           @headers

      last_response.body.include?('password is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if password is not confirmed' do
      login(@organization.owner)

      username = random_username
      post api_v1_organization_users_create_url(id: @organization.id,
                                                username: "#{username}",
                                                email: "#{username}@cartodb.com",
                                                password: 'patata'),
           @headers

      last_response.body.include?('password is not confirmed').should be true
      last_response.status.should == 410
    end

    it 'correctly creates a user' do
      login(@organization.owner)
      username = 'manolo-escobar'
      post api_v1_organization_users_create_url(id: @organization.id,
                                                username: "#{username}",
                                                email: "#{username}@cartodb.com",
                                                password: 'patata',
                                                password_confirmation: 'patata',
                                                soft_geocoding_limit: false,
                                                quota_in_bytes: 1024),
           @headers

      last_response.status.should == 200

      last_user_created = @organization.users[0]
      last_user_created.username.should == username
      last_user_created.email.should == "#{username}@cartodb.com"
      last_user_created.soft_geocoding_limit.should == false
      last_user_created.quota_in_bytes.should == 1024
    end
  end

  describe 'user update' do
    it 'returns 401 for non authorized calls' do
      put api_v1_organization_users_update_url(id: @organization.id), @headers
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      put api_v1_organization_users_update_url(id: @organization.id), @headers
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      put api_v1_organization_users_update_url(id: @organization.id), @headers
      last_response.status.should == 410
    end

    it 'requires an email or username to be provided' do
      login(@organization.owner)

      put api_v1_organization_users_update_url(id: @organization.id),
          @headers

      last_response.status.should == 410
      last_response.body.include?('No update params provided').should be true
    end

    it 'should do nothing if no update params are provided' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email),
          @headers

      last_response.status.should == 410
      last_response.body.include?('No update params provided').should be true
    end

    it 'should not update password if not confirmed' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               password: 'limonero'),
          @headers

      last_response.status.should == 410
      last_response.body.include?('password is not confirmed').should be true
    end

    it 'should update password' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               password: 'limonero',
                                               password_confirmation: 'limonero'),
          @headers

      last_response.status.should == 200
    end

    it 'should update email' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               new_email: new_email),
          @headers

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].email.should == new_email
    end

    it 'should update quota_in_bytes' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               quota_in_bytes: 2048),
          @headers

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].quota_in_bytes.should == 2048
    end

    it 'should update soft_geocoding_limit' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               soft_geocoding_limit: true),
          @headers

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].soft_geocoding_limit.should be true

      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               soft_geocoding_limit: false),
          @headers

      @organization.reload

      last_response.status.should == 200
      @organization.users[0].soft_geocoding_limit.should be false
    end

    it 'should do full update identifying user by email' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      put api_v1_organization_users_update_url(id: @organization.id,
                                               email: user_to_update.email,
                                               new_email: new_email,
                                               password: 'pataton',
                                               password_confirmation: 'pataton',
                                               soft_geocoding_limit: true,
                                               quota_in_bytes: 2048),
          @headers

      @organization.reload

      last_response.status.should == 200

      @organization.users[0].email.should == new_email
      @organization.users[0].soft_geocoding_limit.should be true
      @organization.users[0].quota_in_bytes.should == 2048
    end

    it 'should do full update identifying user by username' do
      login(@organization.owner)

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      put api_v1_organization_users_update_url(id: @organization.id,
                                               username: user_to_update.username,
                                               new_email: new_email,
                                               password: 'pataton',
                                               password_confirmation: 'pataton',
                                               soft_geocoding_limit: true,
                                               quota_in_bytes: 2048),
          @headers

      @organization.reload

      last_response.status.should == 200

      @organization.users[0].email.should == new_email
      @organization.users[0].soft_geocoding_limit.should be true
      @organization.users[0].quota_in_bytes.should == 2048
    end
  end

  describe 'user deletion' do
    it 'returns 401 for non authorized calls' do
      delete api_v1_organization_users_delete_url(id: @organization.id), @headers
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      delete api_v1_organization_users_delete_url(id: @organization.id), @headers
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      delete api_v1_organization_users_delete_url(id: @organization.id), @headers
      last_response.status.should == 410
    end

    it 'should delete users by username' do
      login(@organization.owner)

      user_to_be_deleted = @organization.users[0].dup
      delete api_v1_organization_users_delete_url(id: @organization.id,
                                                  username: user_to_be_deleted.username),
             @headers

      last_response.status.should == 200

      @organization.reload
      @organization.users.map(&:id).include?(user_to_be_deleted.id).should eq false
    end

    it 'should delete users by email' do
      login(@organization.owner)

      user_to_be_deleted = @organization.users[0].dup
      delete api_v1_organization_users_delete_url(id: @organization.id,
                                                  username: user_to_be_deleted.username),
             @headers

      last_response.status.should == 200

      @organization.reload
      @organization.users.map(&:id).include?(user_to_be_deleted.id).should eq false
    end

    it 'should not allow to delete the org owner' do
      login(@organization.owner)

      user_to_be_deleted = @organization.owner
      delete api_v1_organization_users_delete_url(id: @organization.id,
                                                  username: user_to_be_deleted.username),
             @headers

      last_response.status.should == 401
    end
  end
end
