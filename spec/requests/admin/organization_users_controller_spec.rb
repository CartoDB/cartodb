require_relative '../../spec_helper_min'

describe Admin::OrganizationUsersController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:each) do
    host! "#{@organization.name}.localhost.lan"
  end

  let(:username) { unique_name('user') }

  let(:user_params) do
    {
      username: username,
      email: "#{username}@org.com",
      password: 'user-1',
      password_confirmation: 'user-1',
      quota_in_bytes: 1000,
      twitter_datasource_enabled: false
    }
  end

  describe 'security' do
    before do
      @org_user_2.org_admin = true
      @org_user_2.save

      @owner = @org_user_owner
      @admin = @org_user_2
      @user = @org_user_1
    end

    before(:each) do
      User.any_instance.stubs(:validate_credentials_not_taken_in_central).returns(true)
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:update_in_central).returns(true)
      User.any_instance.stubs(:delete_in_central).returns(true)
      User.any_instance.stubs(:load_common_data).returns(true)
      User.any_instance.stubs(:reload_avatar).returns(true)
    end

    describe '#show' do
      it 'returns 404 for non admin users' do
        login_as(@user, scope: @user.username)

        get organization_users_url(user_domain: @user.username)
        last_response.status.should == 404
      end

      it 'returns 200 for admin users' do
        login_as(@admin, scope: @admin.username)

        get organization_users_url(user_domain: @admin.username)
        last_response.status.should == 200
      end

      it 'returns 200 for owner' do
        login_as(@owner, scope: @owner.username)

        get organization_users_url(user_domain: @owner.username)
        last_response.status.should == 200
      end
    end

    describe '#new' do
      it 'returns 404 for non admin users' do
        login_as(@user, scope: @user.username)

        get new_organization_user_url(user_domain: @user.username)
        last_response.status.should == 404
      end

      it 'returns 200 for admin users' do
        login_as(@admin, scope: @admin.username)

        get new_organization_user_url(user_domain: @admin.username)
        last_response.status.should == 200
      end

      it 'returns 200 for owner' do
        login_as(@owner, scope: @owner.username)

        get new_organization_user_url(user_domain: @owner.username)
        last_response.status.should == 200
      end
    end

    describe '#create' do
      it 'fails if password is the username' do
        login_as(@owner, scope: @owner.username)

        post create_organization_user_url(user_domain: @owner.username),
             user: user_params.merge(password: username, password_confirmation: username),
             password_confirmation: @owner.password

        last_response.status.should == 200
        last_response.body.should include 'must be different than the user name'
      end

      it 'fails if password is a common one' do
        login_as(@owner, scope: @owner.username)

        post create_organization_user_url(user_domain: @owner.username),
             user: user_params.merge(password: 'galina', password_confirmation: 'galina'),
             password_confirmation: @owner.password

        last_response.status.should == 200
        last_response.body.should include "can't be a common password"
      end

      it 'fails if password is not strong' do
        @owner.organization.update!(strong_passwords_enabled: true)
        login_as(@owner, scope: @owner.username)

        post(
          create_organization_user_url(user_domain: @owner.username),
          user: user_params.merge(password: 'galinaa', password_confirmation: 'galinaa'),
          password_confirmation: @owner.password
        )

        last_response.status.should == 200
        last_response.body.should include 'must be at least 8 characters long'

        @owner.organization.update!(strong_passwords_enabled: false)
      end

      it 'returns 404 for non admin users' do
        login_as(@user, scope: @user.username)

        post create_organization_user_url(user_domain: @user.username), user: user_params
        last_response.status.should == 404
      end

      it 'returns 200 for admin users trying to create an admin' do
        login_as(@admin, scope: @admin.username)

        post create_organization_user_url(user_domain: @admin.username),
             user: user_params.merge(org_admin: true),
             password_confirmation: @admin.password
        last_response.status.should == 200
        last_response.body.should include 'Validation failed: org_admin can only be set by organization owner'
      end

      it 'returns 403 for admin users trying to create an admin if wrong password_confirmation' do
        login_as(@admin, scope: @admin.username)

        post create_organization_user_url(user_domain: @admin.username),
             user: user_params.merge(org_admin: true),
             password_confirmation: 'wrong'
        last_response.status.should == 403
        last_response.body.should include 'Confirmation password sent does not match your current password'
      end

      it 'returns 302 for admin users trying to create a non-admin' do
        login_as(@admin, scope: @admin.username)

        post create_organization_user_url(user_domain: @admin.username),
             user: user_params,
             password_confirmation: @admin.password
        last_response.status.should == 302
      end

      it 'returns 302 for owner' do
        login_as(@owner, scope: @owner.username)

        post create_organization_user_url(user_domain: @owner.username),
             user: user_params.merge(org_admin: true),
             password_confirmation: @owner.password
        last_response.status.should == 302
      end
    end

    describe '#edit' do
      it 'returns 404 for non admin users' do
        login_as(@user, scope: @user.username)

        get edit_organization_user_url(user_domain: @user.username, id: @user.username)
        last_response.status.should == 404
      end

      it 'returns 403 for admin users trying to edit an admin' do
        login_as(@admin, scope: @admin.username)

        get edit_organization_user_url(user_domain: @admin.username, id: @owner.username)
        last_response.status.should == 403
      end

      it 'returns 200 for admin users trying to edit a non-admin' do
        login_as(@admin, scope: @admin.username)

        get edit_organization_user_url(user_domain: @admin.username, id: @user.username)
        last_response.status.should == 200
      end

      it 'returns 200 for admin users trying to edit themselves' do
        login_as(@admin, scope: @admin.username)

        get edit_organization_user_url(user_domain: @admin.username, id: @admin.username)
        last_response.status.should == 200
      end

      it 'returns 200 for owner' do
        login_as(@owner, scope: @owner.username)

        get edit_organization_user_url(user_domain: @owner.username, id: @admin.username)
        last_response.status.should == 200
      end
    end

    describe '#update' do
      it 'returns 404 for non admin users' do
        login_as(@user, scope: @user.username)

        put update_organization_user_url(user_domain: @user.username, id: @user.username), user: { quota_in_bytes: 7 }
        last_response.status.should == 404
      end

      it 'returns 403 for admin users trying to edit an admin' do
        login_as(@admin, scope: @admin.username)

        put update_organization_user_url(user_domain: @admin.username, id: @owner.username),
            user: { quota_in_bytes: 7 },
            password_confirmation: @admin.password
        last_response.status.should == 403
      end

      it 'returns 200 with error for admin users trying to convert a user into an admin' do
        login_as(@admin, scope: @admin.username)

        put update_organization_user_url(user_domain: @admin.username, id: @user.username),
            user: { org_admin: true },
            password_confirmation: @admin.password
        last_response.status.should == 422
        expect(last_response.body).to include 'org_admin can only be set by organization owner'
      end

      it 'returns 403 if wrong password_confirmation' do
        login_as(@admin, scope: @admin.username)

        put update_organization_user_url(user_domain: @admin.username, id: @user.username),
            user: { quota_in_bytes: 7 },
            password_confirmation: 'wrong'
        last_response.status.should == 403
        last_response.body.should include 'Confirmation password sent does not match your current password'
      end

      it 'returns 302 for admin users trying to edit a non-admin' do
        login_as(@admin, scope: @admin.username)

        put update_organization_user_url(user_domain: @admin.username, id: @user.username),
            user: { quota_in_bytes: 7 },
            password_confirmation: @admin.password
        last_response.status.should == 302
      end

      it 'returns 302 for admin users trying to edit themselves' do
        login_as(@admin, scope: @admin.username)

        put update_organization_user_url(user_domain: @admin.username, id: @admin.username),
            user: { quota_in_bytes: 7 },
            password_confirmation: @admin.password
        last_response.status.should == 302
      end

      it 'returns 302 for owner' do
        login_as(@owner, scope: @owner.username)

        put update_organization_user_url(user_domain: @owner.username, id: @admin.username),
            user: { quota_in_bytes: 7 },
            password_confirmation: @owner.password
        last_response.status.should == 302
      end

      it 'fails if password is the username' do
        login_as(@owner, scope: @owner.username)

        put update_organization_user_url(user_domain: @owner.username, id: @admin.username),
            user: { password: @admin.username, password_confirmation: @admin.username },
            password_confirmation: @owner.password

        last_response.status.should == 422
        last_response.body.should include 'must be different than the user name'
      end

      it 'fails if password is a common one' do
        login_as(@owner, scope: @owner.username)

        put update_organization_user_url(user_domain: @owner.username, id: @admin.username),
            user: { password: 'galina', password_confirmation: 'galina' },
            password_confirmation: @owner.password

        last_response.status.should == 422
        last_response.body.should include "can't be a common password"
      end

      it 'fails if password is not strong' do
        Carto::Organization.any_instance.stubs(:strong_passwords_enabled).returns(true)
        login_as(@owner, scope: @owner.username)

        put update_organization_user_url(user_domain: @owner.username, id: @admin.username),
            user: { password: 'galinaa', password_confirmation: 'galinaa' },
            password_confirmation: @owner.password

        last_response.status.should == 422
        last_response.body.should include 'must be at least 8 characters long'
        Carto::Organization.any_instance.unstub(:strong_passwords_enabled)
      end
    end

    describe '#destroy' do
      it 'returns 404 for non admin users' do
        login_as(@user, scope: @user.username)

        delete delete_organization_user_url(user_domain: @user.username, id: @user.username),
               password_confirmation: @user.password
        last_response.status.should == 404
      end

      it 'returns 403 for admin users trying to destroy an admin' do
        login_as(@admin, scope: @admin.username)

        delete delete_organization_user_url(user_domain: @admin.username, id: @owner.username),
               password_confirmation: @admin.password
        last_response.status.should == 403
      end

      it 'returns 302 for admin users trying to destroy a non-admin' do
        doomed_user = create(:valid_user, organization: @organization)
        login_as(@admin, scope: @admin.username)

        delete delete_organization_user_url(user_domain: @admin.username, id: doomed_user.username),
               password_confirmation: @admin.password
        last_response.status.should == 302
      end

      it 'returns error if wrong password_confirmation' do
        doomed_user = create(:valid_user, organization: @organization)
        login_as(@admin, scope: @admin.username)

        delete delete_organization_user_url(user_domain: @admin.username, id: doomed_user.username),
               password_confirmation: 'wrong'
        last_response.status.should == 302
        follow_redirect!
        last_response.body.should include 'Confirmation password sent does not match your current password'
      end

      it 'returns 302 for owner' do
        doomed_user = create(:valid_user, organization: @organization, org_admin: true)
        login_as(@owner, scope: @owner.username)

        delete delete_organization_user_url(
          user_domain: @owner.username,
          id: doomed_user.username
        ), password_confirmation: @owner.password
        last_response.status.should == 302
      end
    end
  end

  describe 'owner behaviour' do
    before(:each) do
      User.any_instance.stubs(:update_in_central).returns(true)
      User.any_instance.stubs(:create_in_central).returns(true)
      login_as(@org_user_owner, scope: @org_user_owner.username)
    end

    describe '#new' do
      it 'quota defaults to organization default' do
        expected_quota = 123456789
        Carto::Organization.any_instance.stubs(:default_quota_in_bytes).returns(expected_quota)

        get new_organization_user_url(user_domain: @org_user_owner.username)
        last_response.status.should eq 200

        last_response.body.should include 123456789.to_s
      end

      it 'quota defaults to remaining quota if the assigned default goes overquota' do
        expected_quota = @organization.unassigned_quota
        Carto::Organization.any_instance.stubs(:default_quota_in_bytes).returns(123_456_789_012_345)

        get new_organization_user_url(user_domain: @org_user_owner.username)
        last_response.status.should eq 200

        last_response.body.should include expected_quota.to_s
      end
    end

    describe '#show' do
      it 'returns 200 for organization owner users' do
        get organization_users_url(user_domain: @org_user_owner.username)
        last_response.status.should == 200
      end
    end

    describe '#create' do
      it 'creates users' do
        ::User.any_instance.stubs(:create_in_central).returns(true)
        User.any_instance.expects(:load_common_data).once.returns(true)

        post create_organization_user_url(user_domain: @org_user_owner.username),
             user: user_params,
             password_confirmation: @org_user_owner.password
        last_response.status.should eq 302

        user = Carto::User.find_by_username(user_params[:username])
        user.email.should eq user_params[:email]
        user.quota_in_bytes.should eq user_params[:quota_in_bytes]
        user.twitter_datasource_enabled.should be_nil
        user.builder_enabled.should be_nil
        user.engine_enabled.should be_nil

        user.destroy
      end
    end

    describe 'existing user operations' do
      before(:each) do
        @existing_user = create(:carto_user, organization: @carto_organization, password: 'abcdefgh')
      end

      describe '#update' do
        after(:each) do
          ::User[@existing_user.id].destroy
        end

        it 'updates users' do
          new_quota = @existing_user.quota_in_bytes * 2
          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { quota_in_bytes: new_quota },
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @existing_user.reload
          @existing_user.quota_in_bytes.should eq new_quota
        end

        it 'does not update users in case of Central failure' do
          ::User.any_instance.stubs(:update_in_central).raises(CartoDB::CentralCommunicationFailure.new('Failed'))
          new_quota = @existing_user.quota_in_bytes * 2
          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { quota_in_bytes: new_quota },
              password_confirmation: @org_user_owner.password
          last_response.body.should include('There was a problem while updating this user.')

          @existing_user.reload
          @existing_user.quota_in_bytes.should_not eq new_quota
        end

        it 'validates before updating in Central' do
          ::User.any_instance.stubs(:update_in_central).never
          params = {
            password:         'zyx',
            confirm_password: 'abc'
          }

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: params,
              password_confirmation: @org_user_owner.password
          last_response.body.should include('match confirmation')
        end

        it 'cannot update password if it does not change old_password' do
          last_change = @existing_user.last_password_change_date
          ::User.any_instance.stubs(:update_in_central).never
          params = {
            password:         'abcdefgh',
            confirm_password: 'abcdefgh'
          }

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: params
          @existing_user.reload
          @existing_user.last_password_change_date.should eq last_change
        end

        it 'creates a multifactor authentication' do
          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { mfa: '1' },
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @existing_user.reload
          @existing_user.user_multifactor_auths.should_not be_empty
        end

        it 'removes the multifactor authentications' do
          create(:totp, user: @existing_user)
          @existing_user.reload.user_multifactor_auths.should_not be_empty

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { mfa: '0' },
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @existing_user.reload
          @existing_user.user_multifactor_auths.should be_empty
        end

        it 'does not update the user multifactor authentications if the user saving operation fails' do
          User.any_instance.stubs(:save).raises(Sequel::ValidationFailed.new('error!'))

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { mfa: '1' },
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 422

          @existing_user.reload
          @existing_user.user_multifactor_auths.should be_empty
        end

        it 'does not save the user if the multifactor authentication updating operation fails' do
          mfa = Carto::UserMultifactorAuth.new
          Carto::UserMultifactorAuth.stubs(:create!).raises(ActiveRecord::RecordInvalid.new(mfa))

          @existing_user.expects(:save).never

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { mfa: '1' },
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 422
        end
      end

      describe '#destroy' do
        it 'deletes users' do
          delete delete_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
                 password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          ::User[@existing_user.id].should be_nil
        end
      end
    end

    describe 'soft limits' do
      before(:each) do
        User.any_instance.stubs(:load_common_data).returns(true)
      end

      def soft_limit_values(value = nil,
                            soft_geocoding_limit: nil,
                            soft_here_isolines_limit: nil,
                            soft_twitter_datasource_limit: nil)
        values = Hash.new(value)
        values[:soft_geocoding_limit] = soft_geocoding_limit unless soft_geocoding_limit.nil?
        values[:soft_here_isolines_limit] = soft_here_isolines_limit unless soft_here_isolines_limit.nil?
        values[:soft_twitter_datasource_limit] = soft_twitter_datasource_limit unless soft_twitter_datasource_limit.nil?
        values
      end

      def update_soft_limits(user, value,
                             soft_geocoding_limit: nil,
                             soft_here_isolines_limit: nil,
                             soft_twitter_datasource_limit: nil)

        values = soft_limit_values(value,
                                   soft_geocoding_limit: soft_geocoding_limit,
                                   soft_here_isolines_limit: soft_here_isolines_limit,
                                   soft_twitter_datasource_limit: soft_twitter_datasource_limit)

        old_limits = {
          soft_geocoding_limit: user.soft_geocoding_limit,
          soft_here_isolines_limit: user.soft_here_isolines_limit,
          soft_twitter_datasource_limit: user.soft_twitter_datasource_limit
        }

        user.soft_geocoding_limit = values[:soft_geocoding_limit]
        user.soft_here_isolines_limit = values[:soft_here_isolines_limit]
        user.soft_twitter_datasource_limit = values[:soft_twitter_datasource_limit]
        user.save
        user.reload

        old_limits
      end

      def check_soft_limits(user, value)
        values = soft_limit_values(value)

        user.soft_geocoding_limit.should eq values[:soft_geocoding_limit]
        user.soft_here_isolines_limit.should eq values[:soft_here_isolines_limit]
        user.soft_twitter_datasource_limit.should eq values[:soft_twitter_datasource_limit]
      end

      def soft_limits_params(value)
        values = soft_limit_values(value)
        {
          soft_geocoding_limit: values[:soft_geocoding_limit],
          soft_here_isolines_limit: values[:soft_here_isolines_limit],
          soft_twitter_datasource_limit: values[:soft_twitter_datasource_limit]
        }
      end

      describe '#create' do
        after(:each) do
          @user.destroy if @user
        end

        it 'owner cannot enable soft limits if she/he has not' do
          old_limits = update_soft_limits(@org_user_owner, false)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params.merge(soft_limits_params("1")),
               password_confirmation: @org_user_owner.password
          last_response.status.should eq 422

          Carto::User.exists?(username: user_params[:username]).should be_false

          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner cannot enable geocoding limit if she/he has not' do
          old_limits = update_soft_limits(@org_user_owner, false)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params.merge(soft_geocoding_limit: "1"),
               password_confirmation: @org_user_owner.password
          last_response.status.should eq 422

          Carto::User.exists?(username: user_params[:username]).should be_false

          update_soft_limits(@org_user_owner, old_limits)
        end

        # This test is needed now that soft limits toggles become disabled if owner can't assign
        it 'by default soft limits are disabled' do
          old_limits = update_soft_limits(@org_user_owner, false)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params,
               password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @user = Carto::User.where(username: user_params[:username]).first
          check_soft_limits(@user, false)

          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner can enable soft limits if she/he has' do
          old_limits = update_soft_limits(@org_user_owner, true)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params.merge(soft_limits_params("1")),
               password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @user = User.where(username: user_params[:username]).first
          check_soft_limits(@user, true)

          update_soft_limits(@org_user_owner, old_limits)
        end
      end

      describe 'update' do
        after(:each) do
          ::User[@existing_user.id].destroy if @existing_user
        end

        it 'owner cannot enable soft limits if she/he has not' do
          old_limits = update_soft_limits(@org_user_owner, false)
          check_soft_limits(@carto_org_user_owner, false)
          @existing_user = create(:carto_user,
                                              soft_limits_params(false).merge(organization: @carto_organization))

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: soft_limits_params("1"),
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 422

          @existing_user.reload
          check_soft_limits(@existing_user, false)
          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner can enable soft limits if she/he has' do
          old_limits = update_soft_limits(@org_user_owner, true)
          @existing_user = create(:carto_user,
                                              soft_limits_params(false).merge(organization: @carto_organization))

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: soft_limits_params("1"),
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @existing_user.reload
          check_soft_limits(@existing_user, true)
          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner can disable soft limits if she/he has' do
          old_limits = update_soft_limits(@org_user_owner, true)
          @existing_user = create(:carto_user,
                                              soft_limits_params(true).merge(organization: @carto_organization))
          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: soft_limits_params("0"),
              password_confirmation: @org_user_owner.password
          last_response.status.should eq 302

          @existing_user.reload
          check_soft_limits(@existing_user, false)
          update_soft_limits(@org_user_owner, old_limits)
        end
      end

    end
  end
end
