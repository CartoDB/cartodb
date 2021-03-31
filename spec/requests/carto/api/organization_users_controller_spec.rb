require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/organizations_controller'
require 'helpers/unique_names_helper'

describe Carto::Api::OrganizationUsersController do
  include_context 'organization with users helper'
  include UniqueNamesHelper
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

  def user_params_soft_limits(username, soft_limit, with_password: false)
    user_params(username,
                soft_geocoding_limit: soft_limit,
                soft_twitter_datasource_limit: soft_limit,
                soft_here_isolines_limit: soft_limit,
                with_password: with_password)
  end

  def user_params(username = nil,
                  with_password: false,
                  soft_geocoding_limit: false,
                  soft_twitter_datasource_limit: nil,
                  soft_here_isolines_limit: nil,
                  viewer: nil,
                  org_admin: nil,
                  email: "#{username}@carto.com",
                  force_password_change: false)

    params = {
      password: '2{Patrañas}',
      quota_in_bytes: 1024
    }
    unless username.nil?
      params[:username] = username
      params[:email] = email
    end
    params[:soft_geocoding_limit] = soft_geocoding_limit unless soft_geocoding_limit.nil?
    params[:soft_twitter_datasource_limit] = soft_twitter_datasource_limit unless soft_twitter_datasource_limit.nil?
    params[:soft_here_isolines_limit] = soft_here_isolines_limit unless soft_here_isolines_limit.nil?
    params[:viewer] = viewer if viewer
    params[:org_admin] = org_admin if org_admin
    params[:force_password_change] = force_password_change

    params.except!(:password) unless with_password
    params
  end

  def verify_soft_limits(user, value)
    user.soft_geocoding_limit.should eq value
    user.soft_twitter_datasource_limit.should eq value
    user.soft_here_isolines_limit.should eq value
  end

  before(:all) do
    @org_user_2.org_admin = true
    @org_user_2.save
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

    @old_whitelisted_email_domains = @organization.whitelisted_email_domains
  end

  after(:each) do
    set_soft_limits(@organization.owner, @old_soft_limits)
    @organization.owner.save

    @organization.whitelisted_email_domains = @old_whitelisted_email_domains
    @organization.save
  end

  describe 'user creation' do
    it 'returns 401 for non authorized calls' do
      post api_v2_organization_users_create_url(id_or_name: @organization.name)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      post api_v2_organization_users_create_url(id_or_name: @organization.name)
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      post api_v2_organization_users_create_url(id_or_name: @organization.name)
      last_response.status.should == 410
    end

    it 'accepts org admins' do
      login(@org_user_2)

      post api_v2_organization_users_create_url(id_or_name: @organization.name)
      last_response.status.should == 410
    end

    it 'returns 410 if email is not present' do
      login(@organization.owner)

      params = { username: unique_name('user'), password: '2{Patrañas}' }
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.body.include?('email is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if username is not present' do
      login(@organization.owner)

      params = { email: unique_email, password: '2{Patrañas}' }
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.body.include?('username is not present').should be true
      last_response.status.should == 410
    end

    it 'returns 410 if password is not present' do
      login(@organization.owner)

      username = 'manolo'
      params = { username: username, email: "#{username}@carto.com" }
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      last_response.body.include?("password can't be blank").should be true
    end

    it 'returns 410 if password is username' do
      login(@organization.owner)

      username = 'manolo'
      params = { username: username, email: "#{username}@carto.com", password: username }
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      last_response.body.include?('must be different than the user name').should be true
    end

    it 'returns 410 if password is a common one' do
      login(@organization.owner)

      username = 'manolo'
      params = { username: username, email: "#{username}@carto.com", password: 'galina' }
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      last_response.body.include?("can't be a common password").should be true
    end

    it 'returns 410 if password is not strong' do
      Carto::Organization.any_instance.stubs(:strong_passwords_enabled).returns(true)
      login(@organization.owner)

      username = 'manolo'
      params = { username: username, email: "#{username}@carto.com", password: 'galina' }
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      last_response.body.include?('must be at least 8 characters long').should be true
      Carto::Organization.any_instance.unstub(:strong_passwords_enabled)
    end

    it 'correctly creates a user' do
      login(@organization.owner)
      username = 'manolo-escobar'
      params = user_params(username, with_password: true)
      post_json api_v2_organization_users_create_url(id_or_name: @organization.name), params do |response|
        response.status.should eq 200
        response.body[:username].should eq username
        response.body[:email].should eq "#{username}@carto.com"
        response.body[:quota_in_bytes].should eq 1024
        response.body[:builder_enabled].should be_nil
        response.body[:engine_enabled].should be_nil
        response.body[:viewer].should eq false
        response.body[:org_admin].should eq false
        response.body[:base_url].should include(username, @organization.name)
        response.body[:db_size_in_bytes].should eq 0
        response.body[:table_count].should eq 0
        response.body[:public_visualization_count].should eq 0
        response.body[:all_visualization_count].should eq 0
        response.body[:soft_geocoding_limit].should eq false
        # We are returning a nil avatar on creation since this is chosen during creation (Resque)
        # response.body[:avatar_url].should be
      end

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }
      last_user_created.username.should eq username
      last_user_created.email.should eq "#{username}@carto.com"
      last_user_created.soft_geocoding_limit.should eq false
      last_user_created.quota_in_bytes.should eq 1024
      last_user_created.builder_enabled.should be_nil
      last_user_created.engine_enabled.should be_nil
      last_user_created.viewer.should eq false
      last_user_created.org_admin.should eq false
      last_user_created.destroy
    end

    it 'does not take email whitelisting into account for user creation' do
      login(@organization.owner)
      username = 'notwhitelisted'
      domain = 'notwhitelisted.com'
      email = "#{username}@#{domain}"
      params = user_params(username, email: email, with_password: true)

      old_whitelisted_email_domains = @organization.whitelisted_email_domains
      @organization.whitelisted_email_domains = ['carto.com']
      @organization.save

      post_json api_v2_organization_users_create_url(id_or_name: @organization.name), params do |response|
        response.status.should eq 200
        response.body[:username].should eq username
        response.body[:email].should eq email

        @organization.reload
        last_user_created = @organization.users.find { |u| u.username == username }
        last_user_created.username.should eq username
        last_user_created.email.should eq email
      end
    end

    it 'assigns soft_geocoding_limit to false by default' do
      login(@organization.owner)
      username = 'soft-geocoding-limit-false-user'
      params = user_params(username, soft_geocoding_limit: nil, with_password: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }
      last_user_created.soft_geocoding_limit.should eq false
      last_user_created.destroy
    end

    it 'can create viewers' do
      Carto::UserCreation.any_instance.expects(:load_common_data).never
      login(@organization.owner)
      username = 'viewer-user'
      params = user_params(username, viewer: true, with_password: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }
      last_user_created.viewer.should eq true
      last_user_created.destroy
    end

    it 'creates non-admin builders by default' do
      login(@organization.owner)
      username = 'builder-user'
      params = user_params(username, with_password: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }
      last_user_created.viewer.should eq false
      last_user_created.org_admin.should eq false
      last_user_created.destroy
    end

    it 'can create organization admins' do
      login(@organization.owner)
      username = 'admin-user'
      params = user_params(username, org_admin: true, with_password: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }
      last_user_created.org_admin.should eq true
      last_user_created.destroy
    end

    it 'admins cannot create other organization admins' do
      login(@org_user_2)
      username = 'admin-user'
      params = user_params(username, org_admin: true, with_password: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      expect(last_response.body).to include 'org_admin can only be set by organization owner'
    end

    it 'can enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      username = 'soft-limits-true-user'
      params = user_params_soft_limits(username, true, with_password: true)

      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }

      verify_soft_limits(last_user_created, true)

      last_user_created.destroy
    end

    it 'can disable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      username = 'soft-limits-false-user'
      params = user_params_soft_limits(username, false, with_password: true)

      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.find { |u| u.username == username }

      verify_soft_limits(last_user_created, false)

      last_user_created.destroy
    end

    it 'cannot enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit if owner has not them' do
      replace_soft_limits(@organization.owner, [false, false, false, false, false])

      login(@organization.owner)
      username = 'soft-limits-true-invalid-user'
      params = user_params_soft_limits(username, true, with_password: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      errors = JSON.parse(last_response.body)
      errors.count.should eq 3

      @organization.reload
      @organization.users.find { |u| u.username == username }.should be_nil
    end

    describe 'with password expiration' do
      before(:all) do
        @organization.password_expiration_in_d = 10
        @organization.save
      end

      after(:all) do
        @organization.password_expiration_in_d = nil
        @organization.save
      end

      it 'can create users with expired passwords' do
        login(@organization.owner)
        username = unique_name('user')
        params = user_params(username, org_admin: true, with_password: true, force_password_change: true)
        post_json api_v2_organization_users_create_url(id_or_name: @organization.name), params do |response|
          response.status.should eq 200
        end

        @organization.reload
        last_user_created = @organization.users.find { |u| u.username == username }
        expect(last_user_created.password_expired?).to(be(true))
        last_user_created.destroy
      end
    end
  end

  describe 'user update' do
    it 'returns 401 for non authorized calls' do
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'accepts org owners' do
      login(@organization.owner)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 410
    end

    it 'accepts org admins' do
      login(@org_user_2)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 410
    end

    it 'org admins cannot update other admins' do
      login(@org_user_2)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: @organization.owner.username)
      last_response.status.should == 401
    end

    it 'org admins cannot convert other users into admins' do
      login(@org_user_2)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: @org_user_1.username),
          org_admin: true
      last_response.status.should == 410
      expect(last_response.body).to include 'org_admin can only be set by organization owner'
    end

    it 'should do nothing if no update params are provided' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username)

      last_response.status.should eq 410
      last_response.body.include?('No update params provided').should be true
    end

    it 'should update password' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { password: 'limonero' }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 200
    end

    it 'fails to update password if the same as old_password' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      user_to_update.password = '00012345678'
      user_to_update.password_confirmation = '00012345678'
      user_to_update.save
      user_to_update.reload
      last_change = user_to_update.last_password_change_date

      params = { password: '00012345678' }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 410
      user_to_update.reload
      expect(user_to_update.last_password_change_date.utc.to_s).to eq last_change.utc.to_s
    end

    it 'fails to update password if the same as username' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]

      params = { password: user_to_update.username }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 410
      last_response.body.should include 'must be different than the user name'
    end

    it 'fails to update password if it is a common one' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]

      params = { password: 'galina' }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 410
      last_response.body.should include "can't be a common password"
    end

    it 'fails to update password if strongs passwords enabled' do
      Carto::Organization.any_instance.stubs(:strong_passwords_enabled).returns(true)
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]

      params = { password: 'galina' }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 410
      last_response.body.should include 'password must be at least 8 characters long'
      Carto::Organization.any_instance.unstub(:strong_passwords_enabled)
    end

    it 'should update email' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      new_email = "new-#{user_to_update.email}"
      params = { email: new_email }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params
      last_response.status.should eq 200

      user_to_update.reload.email.should == new_email
    end

    it 'should update viewer' do
      login(@organization.owner)

      2.times do
        user_to_update = @org_user_1
        new_viewer = !user_to_update.viewer?
        params = { viewer: new_viewer }
        put api_v2_organization_users_update_url(id_or_name: @organization.name,
                                                 u_username: user_to_update.username),
            params
        last_response.status.should eq 200

        user_to_update.reload.viewer.should == new_viewer
      end
    end

    it 'should update org_admin' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      2.times do
        new_org_admin = !user_to_update.org_admin
        params = { org_admin: new_org_admin }
        put(api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
            params)
        last_response.status.should eq 200

        user_to_update.reload.org_admin.should == new_org_admin
      end
    end

    it 'should reject viewers who are also admins' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { org_admin: true, viewer: true }
      put(api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params)
      last_response.status.should eq 410
    end

    it 'should update quota_in_bytes' do
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { quota_in_bytes: 2048 }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200

      user_to_update.reload
      user_to_update.quota_in_bytes.should == 2048
    end

    it 'should not update soft_geocoding_limit if owner has not it' do
      replace_soft_limits(@organization.owner, [false, false, false])
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { soft_geocoding_limit: true }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 410
      user_to_update.reload.soft_geocoding_limit.should be false
    end

    it 'should update soft_geocoding_limit' do
      replace_soft_limits(@organization.owner, [true, true, true])
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { soft_geocoding_limit: true }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200
      user_to_update.reload.soft_geocoding_limit.should be true

      params = { soft_geocoding_limit: false }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200

      user_to_update.reload
      user_to_update.soft_geocoding_limit.should be false
    end

    it 'should do full update' do
      @organization.owner.soft_geocoding_limit = true
      @organization.owner.save

      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      new_email = "#{user_to_update.email}.es"
      params = { email: new_email,
                 password: 'pataton',
                 soft_geocoding_limit: true,
                 quota_in_bytes: 2048 }
      put_json api_v2_organization_users_update_url(id_or_name: @organization.name,
                                                    u_username: user_to_update.username), params do |response|
        user_to_update.reload

        response.status.should eq 200
        response.body[:username].should eq user_to_update.username
        response.body[:email].should eq new_email
        response.body[:quota_in_bytes].should eq 2048
        response.body[:builder_enabled].should eq user_to_update.builder_enabled
        response.body[:engine_enabled].should eq user_to_update.engine_enabled
        response.body[:viewer].should eq user_to_update.viewer
        response.body[:org_admin].should eq user_to_update.org_admin
        response.body[:base_url].should include(user_to_update.username, @organization.name)
        response.body[:db_size_in_bytes].should eq 0
        response.body[:table_count].should eq 0
        response.body[:public_visualization_count].should eq 0
        response.body[:all_visualization_count].should eq 0
        response.body[:avatar_url].should eq user_to_update.avatar_url
        response.body[:soft_geocoding_limit].should eq true
      end

      user_to_update.email.should eq new_email
      user_to_update.soft_geocoding_limit.should be true
      user_to_update.quota_in_bytes.should == 2048
    end

    it 'can enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      user_to_update = @organization.non_owner_users[0]
      params = user_params_soft_limits(nil, true, with_password: false)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200

      user_to_update.reload
      verify_soft_limits(user_to_update, true)
    end

    it 'can disable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      user_to_update = @organization.non_owner_users[0]
      params = user_params_soft_limits(nil, false, with_password: false)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params
      last_response.status.should eq 200

      user_to_update.reload
      verify_soft_limits(user_to_update, false)
    end

    it 'cannot enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit if owner has not them' do
      replace_soft_limits(@organization.owner, [false, false, false, false, false])

      login(@organization.owner)
      user_to_update = @organization.non_owner_users[0]
      replace_soft_limits(user_to_update, [false, false, false])
      params = user_params_soft_limits(nil, true, with_password: false)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 410
      errors = JSON.parse(last_response.body)
      errors.count.should eq 3

      user_to_update.reload
      verify_soft_limits(user_to_update, false)
    end

    it 'should not update if it cannot update in central' do
      ::User.any_instance.stubs(:update_in_central).raises(CartoDB::CentralCommunicationFailure.new('Failed'))
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { email: 'fail-' + user_to_update.email }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 500
      user_to_update.reload
      user_to_update.email.should_not start_with('fail-')
    end

    it 'should validate password before updating in Central' do
      ::User.any_instance.unstub(:update_in_central)
      ::User.any_instance.stubs(:update_in_central).never
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { password: 'a' }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 410
    end

    it 'should validate before updating in Central' do
      ::User.any_instance.unstub(:update_in_central)
      ::User.any_instance.stubs(:update_in_central).never
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { quota_in_bytes: @organization.quota_in_bytes * 2 }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should == 410
    end
  end

  describe 'user deletion' do
    it 'returns 401 for non authorized calls' do
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      delete api_v2_organization_users_delete_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'should delete users as owner' do
      login(@organization.owner)

      user_to_be_deleted = @organization.non_owner_users[0]
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                  u_username: user_to_be_deleted.username)

      last_response.status.should eq 200

      User[user_to_be_deleted.id].should be_nil
    end

    it 'should delete users with unregistered tables if force parameter is present' do
      login(@organization.owner)

      user_with_unregistered_tables = create_test_user('foobarbaz', @organization)
      user_with_unregistered_tables.in_database.run('CREATE TABLE wadus (id serial)')

      delete api_v2_organization_users_delete_url(
        id_or_name: @organization.name,
        u_username: user_with_unregistered_tables.username,
        force: true
      )

      last_response.status.should eq 200

      User[user_with_unregistered_tables.id].should be_nil
    end

    it 'should fail trying to delete users with unregistered tables and no force parameter present' do
      login(@organization.owner)

      user_with_unregistered_tables = create_test_user('foobarbaz', @organization)
      user_with_unregistered_tables.in_database.run('CREATE TABLE wadus (id serial)')

      delete api_v2_organization_users_delete_url(
        id_or_name: @organization.name,
        u_username: user_with_unregistered_tables.username
      )

      last_response.status.should eq 500
    end

    it 'should delete users as admin' do
      login(@org_user_2)

      victim = create(:valid_user, organization: @organization)
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                  u_username: victim.username)

      last_response.status.should eq 200

      User[victim.id].should be_nil
    end

    it 'should not delete other admins as admin' do
      login(@org_user_2)

      victim = create(:valid_user, organization: @organization, org_admin: true)
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                  u_username: victim.username)

      last_response.status.should eq 401

      User[victim.id].should be
    end

    it 'should not allow to delete the org owner' do
      login(@organization.owner)

      user_to_be_deleted = @organization.owner
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                  u_username: user_to_be_deleted.username)

      last_response.status.should == 401
    end

    describe 'with Central' do
      include_context 'with MessageBroker stubs'

      let(:organization) { create(:organization_with_users) }
      let(:user) { organization.non_owner_users.first }

      before do
        ::User.any_instance.unstub(:delete_in_central)
        Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(true)
      end

      it 'requests user deletion to Central' do
        TopicDouble.any_instance.expects(:publish).once.with(
          :delete_org_user,
          { organization_name: organization.name, username: user.username }
        )

        login(organization.owner)

        delete api_v2_organization_users_delete_url(id_or_name: organization.name,
                                                    u_username: user.username)

        last_response.status.should eq 200
      end

      it 'does not request deletion to Central if deletion failed in the cloud' do
        ::User.any_instance.stubs(:delete_in_central).never
        ::User.any_instance.stubs(:destroy).raises('BOOM')
        login(organization.owner)

        delete api_v2_organization_users_delete_url(id_or_name: organization.name,
                                                    u_username: user.username)

        last_response.status.should eq 500
      end
    end
  end

  describe 'user show' do
    it 'returns 401 for non authorized calls' do
      get api_v2_organization_users_show_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      get api_v2_organization_users_show_url(id_or_name: @organization.name, u_username: @org_user_1.username)
      last_response.status.should == 401
    end

    it 'should return 404 for non existing users' do
      login(@organization.owner)

      get api_v2_organization_users_show_url(id_or_name: @organization.name, u_username: 'bogus-non-existent-user')

      last_response.status.should == 404
    end

    it 'should show existing users' do
      login(@organization.owner)

      @organization.reload
      user_to_be_shown = @organization.non_owner_users[0]
      get api_v2_organization_users_show_url(id_or_name: @organization.name, u_username: user_to_be_shown.username)

      last_response.status.should eq 200
      last_response.body == Carto::Api::UserPresenter.new(user_to_be_shown, current_viewer: @organization.owner).to_poro
    end
  end

  describe 'user list' do
    it 'returns 401 for non authorized calls' do
      get api_v2_organization_users_index_url(id_or_name: @organization.name)
      last_response.status.should == 401
    end

    it 'returns 401 for non authorized users' do
      login(@org_user_1)

      get api_v2_organization_users_index_url(id_or_name: @organization.name)
      last_response.status.should == 401
    end

    it 'returns 401 when session is not valid' do
      organization = create_organization_with_owner
      user = create(:valid_user, organization: organization, org_admin: true)

      login_response = post_session(user: user, password: 'kkkkkkkkk', organization: organization)
      set_cookies_for_next_request(login_response)

      get api_v2_organization_users_index_url(id_or_name: organization.name)
      last_response.status.should == 200

      user.invalidate_all_sessions!

      set_cookies_for_next_request(login_response)

      get api_v2_organization_users_index_url(id_or_name: organization.name)
      last_response.status.should == 401
    end

    it 'should list users' do
      login(@organization.owner)

      @organization.reload
      organization_users_presentations = @organization.users.each do |user|
        Carto::Api::UserPresenter.new(user, current_viewer: @organization.owner).to_poro
      end

      get api_v2_organization_users_index_url(id_or_name: @organization.name)

      last_response.status.should eq 200

      last_response.body == organization_users_presentations
    end
  end
end
