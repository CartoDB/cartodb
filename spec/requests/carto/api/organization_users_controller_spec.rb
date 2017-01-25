# encoding: utf-8

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
      user.soft_here_isolines_limit,
      user.soft_obs_snapshot_limit,
      user.soft_obs_general_limit
    ]
  end

  def set_soft_limits(user, soft_limits)
    user.soft_geocoding_limit = soft_limits[0]
    user.soft_twitter_datasource_limit = soft_limits[1]
    user.soft_here_isolines_limit = soft_limits[2]
    user.soft_obs_snapshot_limit = soft_limits[3]
    user.soft_obs_general_limit = soft_limits[4]
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
                soft_here_isolines_limit: soft_limit,
                soft_obs_snapshot_limit: soft_limit,
                soft_obs_general_limit: soft_limit)
  end

  def user_params(username = nil,
                  soft_geocoding_limit: false,
                  soft_twitter_datasource_limit: nil,
                  soft_here_isolines_limit: nil,
                  soft_obs_snapshot_limit: nil,
                  soft_obs_general_limit: nil,
                  viewer: nil)

    params = {
      password: '2{Patrañas}',
      quota_in_bytes: 1024
    }
    unless username.nil?
      params[:username] = username
      params[:email] = "#{username}@carto.com"
    end
    params[:soft_geocoding_limit] = soft_geocoding_limit unless soft_geocoding_limit.nil?
    params[:soft_twitter_datasource_limit] = soft_twitter_datasource_limit unless soft_twitter_datasource_limit.nil?
    params[:soft_here_isolines_limit] = soft_here_isolines_limit unless soft_here_isolines_limit.nil?
    params[:soft_obs_snapshot_limit] = soft_obs_snapshot_limit unless soft_obs_snapshot_limit.nil?
    params[:soft_obs_general_limit] = soft_obs_general_limit unless soft_obs_general_limit.nil?
    params[:viewer] = viewer if viewer

    params
  end

  def verify_soft_limits(user, value)
    user.soft_geocoding_limit.should eq value
    user.soft_twitter_datasource_limit.should eq value
    user.soft_here_isolines_limit.should eq value
    user.soft_obs_snapshot_limit.should eq value
    user.soft_obs_general_limit.should eq value
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
      last_response.body.include?('password is not present').should be true
    end

    it 'correctly creates a user' do
      login(@organization.owner)
      username = 'manolo-escobar'
      params = user_params(username)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      last_user_created = @organization.users.detect { |u| u.username == username }
      last_user_created.username.should eq username
      last_user_created.email.should eq "#{username}@carto.com"
      last_user_created.soft_geocoding_limit.should eq false
      last_user_created.quota_in_bytes.should eq 1024
      last_user_created.builder_enabled.should be_nil
      last_user_created.destroy
    end

    it 'assigns soft_geocoding_limit to false by default' do
      login(@organization.owner)
      username = 'soft-geocoding-limit-false-user'
      params = user_params(username, soft_geocoding_limit: nil)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.detect { |u| u.username == username }
      last_user_created.soft_geocoding_limit.should eq false
      last_user_created.destroy
    end

    it 'can create viewers' do
      login(@organization.owner)
      username = 'viewer-user'
      params = user_params(username, viewer: true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.detect { |u| u.username == username }
      last_user_created.viewer.should eq true
      last_user_created.destroy
    end

    it 'creates builders by default' do
      login(@organization.owner)
      username = 'builder-user'
      params = user_params(username)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.detect { |u| u.username == username }
      last_user_created.viewer.should eq false
      last_user_created.destroy
    end

    it 'can enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit, obs_snapshot_limit and obs_general_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      username = 'soft-limits-true-user'
      params = user_params_soft_limits(username, true)

      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.detect { |u| u.username == username }

      verify_soft_limits(last_user_created, true)

      last_user_created.destroy
    end

    it 'can disable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit, obs_snapshot_limit and obs_general_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      username = 'soft-limits-false-user'
      params = user_params_soft_limits(username, false)

      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 200

      @organization.reload
      last_user_created = @organization.users.detect { |u| u.username == username }

      verify_soft_limits(last_user_created, false)

      last_user_created.destroy
    end

    it 'cannot enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit, obs_snapshot_limit or obs_general_limit if owner has not them' do
      replace_soft_limits(@organization.owner, [false, false, false, false, false])

      login(@organization.owner)
      username = 'soft-limits-true-invalid-user'
      params = user_params_soft_limits(username, true)
      post api_v2_organization_users_create_url(id_or_name: @organization.name), params

      last_response.status.should eq 410
      errors = JSON.parse(last_response.body)
      errors.count.should eq 5

      @organization.reload
      @organization.users.detect { |u| u.username == username }.should be_nil
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
        user_to_update = @organization.non_owner_users[0]
        new_viewer = !user_to_update.viewer?
        params = { viewer: new_viewer }
        put api_v2_organization_users_update_url(id_or_name: @organization.name,
                                                 u_username: user_to_update.username),
            params
        last_response.status.should eq 200

        user_to_update.reload.viewer.should == new_viewer
      end
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

      user_to_update = @organization.users[0]
      params = { soft_geocoding_limit: true }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 410
      user_to_update.reload.soft_geocoding_limit.should be false
    end

    it 'should update soft_geocoding_limit' do
      replace_soft_limits(@organization.owner, [true, true, true])
      login(@organization.owner)

      user_to_update = @organization.users[0]
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

      user_to_update = @organization.users[0]
      new_email = "#{user_to_update.email}.es"
      params = { email: new_email,
                 password: 'pataton',
                 soft_geocoding_limit: true,
                 quota_in_bytes: 2048 }
      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200

      user_to_update.reload

      user_to_update.email.should eq new_email
      user_to_update.soft_geocoding_limit.should be true
      user_to_update.quota_in_bytes.should == 2048
    end

    it 'can enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit, obs_snapshot_limit and obs_general_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      user_to_update = @organization.users[0]
      params = user_params_soft_limits(nil, true)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200

      user_to_update.reload
      verify_soft_limits(user_to_update, true)
    end

    it 'can disable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit, obs_snapshot_limit and obs_general_limit if owner has them' do
      replace_soft_limits(@organization.owner, [true, true, true, true, true])

      login(@organization.owner)
      user_to_update = @organization.users[0]
      params = user_params_soft_limits(nil, false)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 200

      user_to_update.reload
      verify_soft_limits(user_to_update, false)
    end

    it 'cannot enable soft geocoding_limit, twitter_datasource_limit, here_isolines_limit, obs_snapshot_limit and obs_general_limit if owner has not them' do
      replace_soft_limits(@organization.owner, [false, false, false, false, false])

      login(@organization.owner)
      user_to_update = @organization.users[0]
      replace_soft_limits(user_to_update, [false, false, false])
      params = user_params_soft_limits(nil, true)

      put api_v2_organization_users_update_url(id_or_name: @organization.name, u_username: user_to_update.username),
          params

      last_response.status.should eq 410
      errors = JSON.parse(last_response.body)
      errors.count.should eq 5

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

    it 'should validate before updating in Central' do
      ::User.any_instance.unstub(:update_in_central)
      ::User.any_instance.stubs(:update_in_central).never
      login(@organization.owner)

      user_to_update = @organization.non_owner_users[0]
      params = { password: 'a' }
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

    it 'should delete users' do
      login(@organization.owner)

      user_to_be_deleted = @organization.non_owner_users[0]
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                  u_username: user_to_be_deleted.username)

      last_response.status.should eq 200

      User[user_to_be_deleted.id].should be_nil
    end

    it 'should not allow to delete the org owner' do
      login(@organization.owner)

      user_to_be_deleted = @organization.owner
      delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                  u_username: user_to_be_deleted.username)

      last_response.status.should == 401
    end

    describe 'with Central' do
      before(:each) do
        ::User.any_instance.unstub(:delete_in_central)
        Cartodb::Central.stubs(:sync_data_with_cartodb_central?).returns(true)
        @organization.reload
        @user_to_be_deleted = @organization.non_owner_users.first
      end

      def mock_delete_request(code)
        response_mock = mock
        response_mock.stubs(:code).returns(code)
        response_mock.stubs(:body).returns('{"errors": []}')
        Carto::Http::Request.any_instance.stubs(:run).returns(response_mock)
      end

      it 'should delete users in Central' do
        ::User.any_instance.stubs(:destroy).once
        mock_delete_request(204)
        login(@organization.owner)

        delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                    u_username: @user_to_be_deleted.username)

        last_response.status.should eq 200
      end

      it 'should delete users missing from Central' do
        ::User.any_instance.stubs(:destroy).once
        mock_delete_request(404)
        login(@organization.owner)

        delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                    u_username: @user_to_be_deleted.username)

        last_response.status.should eq 200
      end

      it 'should not delete users that failed to delete from Central' do
        ::User.any_instance.stubs(:destroy).never
        mock_delete_request(500)
        login(@organization.owner)

        delete api_v2_organization_users_delete_url(id_or_name: @organization.name,
                                                    u_username: @user_to_be_deleted.username)

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
