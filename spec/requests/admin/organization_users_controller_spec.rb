# encoding: utf-8

require_relative '../../spec_helper_min'

describe Admin::OrganizationUsersController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:each) do
    host! "#{@organization.name}.localhost.lan"
  end

  let(:username) { 'user-1' }

  let(:user_params) do
    {
      username: username,
      email: 'user-1@org.com',
      password: 'user-1',
      password_confirmation: 'user-1',
      quota_in_bytes: 1000,
      twitter_datasource_enabled: false
    }
  end

  describe 'security' do
    describe '#show' do
      it 'returns 404 for non authorized users' do

        login_as(@org_user_1, scope: @org_user_1.username)

        get organization_users_url(user_domain: @org_user_1.username)
        last_response.status.should == 404
      end
    end
  end

  describe 'owner behaviour' do
    before(:each) do
      login_as(@org_user_owner, scope: @org_user_owner.username)
    end

    describe '#show' do
      it 'returns 200 for organization owner users' do
        get organization_users_url(user_domain: @org_user_owner.username)
        last_response.status.should == 200
      end
    end

    describe '#create' do
      it 'creates users' do
        User.any_instance.expects(:load_common_data).once.returns(true)

        post create_organization_user_url(user_domain: @org_user_owner.username), user: user_params
        last_response.status.should eq 302

        user = Carto::User.find_by_username(user_params[:username])
        user.email.should eq user_params[:email]
        user.quota_in_bytes.should eq user_params[:quota_in_bytes]
        user.twitter_datasource_enabled.should be_nil

        user.destroy
      end
    end

    describe 'existing user operations' do
      before(:each) do
        @existing_user = FactoryGirl.create(:carto_user, organization: @carto_organization)
      end

      describe '#update' do
        after(:each) do
          ::User[@existing_user.id].destroy
        end

        it 'updates users' do
          new_quota = @existing_user.quota_in_bytes * 2
          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: { quota_in_bytes: new_quota }
          last_response.status.should eq 302

          @existing_user.reload
          @existing_user.quota_in_bytes.should eq new_quota
        end
      end

      describe '#destroy' do
        it 'deletes users' do
          delete delete_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username)
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

        it 'owner cannot enable soft limits if he has not' do
          old_limits = update_soft_limits(@org_user_owner, false)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params.merge(soft_limits_params("1"))
          last_response.status.should eq 422

          Carto::User.exists?(username: user_params[:username]).should be_false

          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner cannot enable geocoding limit if he has not' do
          old_limits = update_soft_limits(@org_user_owner, false)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params.merge(soft_geocoding_limit: "1")
          last_response.status.should eq 422

          Carto::User.exists?(username: user_params[:username]).should be_false

          update_soft_limits(@org_user_owner, old_limits)
        end

        # This test is needed now that soft limits toggles become disabled if owner can't assign
        it 'by default soft limits are disabled' do
          old_limits = update_soft_limits(@org_user_owner, false)

          post create_organization_user_url(user_domain: @org_user_owner.username), user: user_params
          last_response.status.should eq 302

          @user = Carto::User.where(username: user_params[:username]).first
          check_soft_limits(@user, false)

          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner can enable soft limits if he has' do
          old_limits = update_soft_limits(@org_user_owner, true)

          post create_organization_user_url(user_domain: @org_user_owner.username),
               user: user_params.merge(soft_limits_params("1"))
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

        it 'owner cannot enable soft limits if he has not' do
          old_limits = update_soft_limits(@org_user_owner, false)
          check_soft_limits(@carto_org_user_owner, false)
          @existing_user = FactoryGirl.create(:carto_user,
                                              soft_limits_params(false).merge(organization: @carto_organization))

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: soft_limits_params("1")
          last_response.status.should eq 422

          @existing_user.reload
          check_soft_limits(@existing_user, false)
          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner can enable soft limits if he has' do
          old_limits = update_soft_limits(@org_user_owner, true)
          @existing_user = FactoryGirl.create(:carto_user,
                                              soft_limits_params(false).merge(organization: @carto_organization))

          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: soft_limits_params("1")
          last_response.status.should eq 302

          @existing_user.reload
          check_soft_limits(@existing_user, true)
          update_soft_limits(@org_user_owner, old_limits)
        end

        it 'owner can disable soft limits if he has' do
          old_limits = update_soft_limits(@org_user_owner, true)
          @existing_user = FactoryGirl.create(:carto_user,
                                              soft_limits_params(true).merge(organization: @carto_organization))
          put update_organization_user_url(user_domain: @org_user_owner.username, id: @existing_user.username),
              user: soft_limits_params("0")
          last_response.status.should eq 302

          @existing_user.reload
          check_soft_limits(@existing_user, false)
          update_soft_limits(@org_user_owner, old_limits)
        end
      end

    end
  end
end
