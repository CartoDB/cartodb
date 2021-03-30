require_relative '../../../spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/users_controller'

describe Carto::Api::UsersController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @headers = { 'CONTENT_TYPE' => 'application/json' }
    create(:notification, organization: @carto_organization)
  end

  before(:each) do
    ::User.any_instance.stubs(:create_in_central).returns(true)
    ::User.any_instance.stubs(:update_in_central).returns(true)
    create(:carto_visualization, user: @carto_org_user_owner, privacy: Carto::Visualization::PRIVACY_PUBLIC)
    create(:carto_visualization, user: @carto_org_user_owner,
                                             privacy: Carto::Visualization::PRIVACY_PRIVATE)
    create(:carto_visualization, user: @carto_org_user_owner, privacy: Carto::Visualization::PRIVACY_LINK)
    create(:carto_visualization, user: @carto_org_user_owner, privacy: Carto::Visualization::PRIVACY_LINK)
    create(:carto_visualization, user: @carto_org_user_owner,
                                             privacy: Carto::Visualization::PRIVACY_PROTECTED, password: 'a')
    create(:carto_visualization, user: @carto_org_user_owner,
                                             privacy: Carto::Visualization::PRIVACY_PROTECTED, password: 'a')
    create(:carto_visualization, user: @carto_org_user_owner,
                                             privacy: Carto::Visualization::PRIVACY_PROTECTED, password: 'a')
  end

  describe 'me' do
    it 'contains hubspot_form_ids in config' do
      CartoDB::Hubspot.any_instance.stubs(:enabled?).returns(true)
      CartoDB::Hubspot.any_instance.stubs(:token).returns('something')

      params = { user_domain: @org_user_1.username, api_key: @org_user_1.api_key }

      get_json api_v3_users_me_url(params), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to have_key(:config)
        expect(response.body[:config]).to have_key(:hubspot_form_ids)
      end
      CartoDB::Hubspot.any_instance.unstub(:enabled?)
      CartoDB::Hubspot.any_instance.unstub(:token)
    end

    it 'returns the user info even when locked' do
      @org_user_1.update(state: 'locked')
      params = { user_domain: @org_user_1.username, api_key: @org_user_1.api_key }

      get_json api_v3_users_me_url(params), @headers do |response|
        expect(response.status).to eq(200)

        expect(response.body[:user_data][:username]).to eq(@org_user_1.username)
      end

      @org_user_1.update(state: 'active')
    end

    it 'returns a hash with current user info' do
      params = { user_domain: @carto_org_user_owner.username, api_key: @carto_org_user_owner.api_key }

      get_json api_v3_users_me_url(params), @headers do |response|
        expect(response.status).to eq(200)

        expect(response.body[:default_fallback_basemap].with_indifferent_access).to eq(@carto_org_user_owner.default_basemap)

        dashboard_notifications = @carto_org_user_owner.notifications_for_category(:dashboard)

        expect(response.body[:dashboard_notifications]).to eq(dashboard_notifications)
        expect(response.body[:organization_notifications].count).to eq(1)
        expect(response.body[:organization_notifications].first[:icon]).to eq(
          @carto_org_user_owner.received_notifications.unread.first.icon
        )
        expect(response.body[:can_change_email]).to eq(@carto_org_user_owner.can_change_email?)
        expect(response.body[:auth_username_password_enabled]).to eq(true)
        expect(response.body[:can_change_password]).to eq(true)
        expect(response.body[:plan_name]).to eq('ORGANIZATION USER')
        expect(response.body[:services]).to eq(@carto_org_user_owner.get_oauth_services.map(&:symbolize_keys))
        expect(response.body[:google_sign_in]).to eq(@carto_org_user_owner.google_sign_in)
        expect(response.body[:user_data][:public_privacy_map_count]).to eq 1
        expect(response.body[:user_data][:link_privacy_map_count]).to eq 2
        expect(response.body[:user_data][:password_privacy_map_count]).to eq 3
        expect(response.body[:user_data][:private_privacy_map_count]).to eq 1
      end
    end

    it 'returns a hash with only config if there is no authenticated user' do
      get_json api_v3_users_me_url, @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body).to have_key(:config)
        expect(response.body[:user_frontend_version]).to eq(CartoDB::Application.frontend_version)
      end
    end

    context 'license_expiration field' do
      before(:each) do
        @expiration_date = Time.parse("2020-11-05T00:00:00.000+00:00")
      end

      after(:each) do
        Carto::Api::UsersController.any_instance.unstub(:license_expiration_date)
      end

      it 'is nil for cloud' do
        Carto::Api::UsersController.any_instance.stubs(:license_expiration_date).returns(@expiration_date)

        Cartodb.with_config(cartodb_com_hosted: false) do
          get_json api_v3_users_me_url, @headers do |response|
            expect(response.status).to eq(200)
            expect(response.body[:license_expiration]).to be_nil
          end
        end
      end

      it 'is nil if the license_expiration_date does not exist (gear not loaded)' do
        Cartodb.with_config(cartodb_com_hosted: true) do
          get_json api_v3_users_me_url, @headers do |response|
            expect(response.status).to eq(200)
            expect(response.body[:license_expiration]).to be_nil
          end
        end
      end

      it 'gets the date from the license' do
        Carto::Api::UsersController.any_instance.stubs(:license_expiration_date).returns(@expiration_date)

        params = { user_domain: @org_user_1.username, api_key: @org_user_1.api_key }

        Cartodb.with_config(cartodb_com_hosted: true) do
          get_json api_v3_users_me_url(params), @headers do |response|
            expect(response.status).to eq(200)
            expect(response.body[:license_expiration]).to eq "2020-11-05T00:00:00.000+00:00"
          end
        end
      end
    end

    context 'is_enterprise field' do
      before(:all) do
        @params = { user_domain: @org_user_1.username, api_key: @org_user_1.api_key }
      end

      after(:each) do
        User.any_instance.unstub(:account_type)
      end

      it 'returns false for Individual plan' do
        Carto::User.any_instance.stubs(account_type: 'Individual')

        get_json api_v3_users_me_url(@params), @headers do |response|
          expect(response.status).to eq(200)
          expect(response.body[:user_data][:is_enterprise]).to eq(false)
        end
      end

      it 'returns true for an enterprise plan' do
        Carto::User.any_instance.stubs(account_type: 'ENTERPRISE LUMP-SUM')

        get_json api_v3_users_me_url(@params), @headers do |response|
          expect(response.status).to eq(200)
          expect(response.body[:user_data][:is_enterprise]).to eq(true)
        end
      end
    end
  end

  describe 'update_me' do
    context 'account updates' do
      before(:each) do
        @user = create(:user, password: 'foobarbaz', password_confirmation: 'foobarbaz')
      end

      after(:each) do
        @user.destroy
      end

      let(:url_options) do
        {
          user_domain: @user.username,
          user_id: @user.id,
          api_key: @user.api_key
        }
      end

      it 'gives an error if password is the same as password_confirmation' do
        last_change = @user.last_password_change_date
        payload = {
          user: {
            email: 'foo@bar.baz',
            password_confirmation: 'foobarbaz',
            new_password: 'foobarbaz',
            confirm_password: 'foobarbaz'
          }
        }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(400)

          expect(response.body[:errors]).to have_key(:new_password)
          expect(response.body[:errors][:new_password]).to eq ['New password cannot be the same as old password']
          @user.reload
          expect(@user.last_password_change_date).to eq(last_change)
        end
      end

      it 'gives a status code 200 if payload is empty' do
        put_json api_v3_users_update_me_url(url_options), {}, @headers do |response|
          expect(response.status).to eq(200)
        end
      end

      it 'gives an error if there is no old password' do
        payload = { user: { email: 'foo1@bar.baz' } }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(403)
          expect(response.body[:message]).to eq("Error updating your account details")
          expect(response.body[:errors]).to have_key(:password)
        end
      end

      it 'updates account if old password is correct' do
        payload = { user: { email: 'foo1@bar.baz',
                            password_confirmation: 'foobarbaz' } }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(200)

          @user.refresh
          expect(@user.email).to eq('foo1@bar.baz')
        end
      end

      it 'gives an error if email is invalid' do
        payload = { user: { email: 'foo@',
                            password_confirmation: 'foobarbaz' } }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(400)
          expect(response.body[:message]).to eq("Error updating your account details")
          expect(response.body[:errors]).to have_key(:email)
        end
      end

      it 'gives an error if old password is invalid' do
        payload = { user: { password_confirmation: 'idontknow', new_password: 'barbaz', confirm_password: 'barbaz' } }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(403)
          expect(response.body[:message]).to eq("Error updating your account details")
          expect(response.body[:errors]).to have_key(:password)
        end
      end

      it 'gives an error if new password and confirmation are not the same' do
        payload = { user: { password_confirmation: 'foobarbaz', new_password: 'foofoo', confirm_password: 'barbar' } }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(400)
          expect(response.body[:message]).to eq("Error updating your account details")
          expect(response.body[:errors]).to have_key(:new_password)
        end
      end

      it 'returns 401 if user is not logged in' do
        put_json api_v3_users_update_me_url(url_options.except(:api_key)), @headers do |response|
          expect(response.status).to eq(401)
        end
      end

      it 'updates account data for the given user' do
        last_change = @user.last_password_change_date
        payload = {
          user: {
            email: 'foo@bar.baz',
            password_confirmation: 'foobarbaz',
            new_password: 'bazbarfoo',
            confirm_password: 'bazbarfoo'
          }
        }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(200)

          @user.refresh
          expect(@user.email).to eq('foo@bar.baz')
          expect(@user.last_password_change_date).to_not eq(last_change)
        end
      end

      context 'multifactor authentication' do
        it 'creates a multifactor authentication' do
          payload = { user: { password_confirmation: 'foobarbaz', mfa: true } }

          put_json api_v3_users_update_me_url(url_options), payload, @headers

          @user.reload.user_multifactor_auths.should_not be_empty
        end

        it 'removes the multifactor authentications' do
          create(:totp, user_id: @user.id)
          payload = { user: { password_confirmation: 'foobarbaz', mfa: false } }

          @user.reload.user_multifactor_auths.should_not be_empty

          put_json api_v3_users_update_me_url(url_options), payload, @headers

          last_response.status.should eq 200
          @user.reload.user_multifactor_auths.should be_empty
        end

        it 'does not update the user multifactor authentications if the user saving operation fails' do
          User.any_instance.stubs(:save).raises(Sequel::ValidationFailed.new('error!'))
          payload = { user: { password_confirmation: 'foobarbaz', mfa: false } }

          put_json api_v3_users_update_me_url(url_options), payload, @headers

          last_response.status.should eq 400
          @user.reload.user_multifactor_auths.should be_empty
        end

        it 'does not save the user if the multifactor authentication updating operation fails' do
          mfa = Carto::UserMultifactorAuth.new
          Carto::UserMultifactorAuth.stubs(:create!).raises(ActiveRecord::RecordInvalid.new(mfa))
          payload = { user: { password_confirmation: 'foobarbaz', mfa: true } }

          @user.expects(:save).never

          put_json api_v3_users_update_me_url(url_options), payload, @headers

          last_response.status.should eq 400
        end
      end
    end

    context 'profile updates' do
      before(:each) do
        @user = create(:user, password: 'foobarbaz', password_confirmation: 'foobarbaz')
      end

      after(:each) do
        @user.destroy
      end

      let(:url_options) do
        {
          user_domain: @user.username,
          user_id: @user.id,
          api_key: @user.api_key
        }
      end

      it 'updates profile data for the given user' do
        payload = {
          user: {
            name: 'Foo',
            last_name: 'Bar',
            website: 'https://carto.rocks',
            description: 'Foo Bar Baz',
            location: 'Anywhere',
            twitter_username: 'carto',
            disqus_shortname: 'carto',
            avatar_url: 'http://carto.rocks/avatar.jpg',
            password_confirmation: 'foobarbaz'
          }
        }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(200)

          expect(response.body[:name]).to eq('Foo')
          expect(response.body[:last_name]).to eq('Bar')
          expect(response.body[:website]).to eq('https://carto.rocks')
          expect(response.body[:description]).to eq('Foo Bar Baz')
          expect(response.body[:location]).to eq('Anywhere')
          expect(response.body[:twitter_username]).to eq('carto')
          expect(response.body[:disqus_shortname]).to eq('carto')
          expect(response.body[:avatar_url]).to eq('http://carto.rocks/avatar.jpg')
        end
      end

      it 'does not update profile data if old password is wrong' do
        payload = {
          user: {
            name: 'Foo2',
            password_confirmation: 'prapra'
          }
        }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(403)

          @user.reload
          @user.username.should_not eq 'Foo2'
        end
      end

      it 'does not update profile data if password_confirmation is missing' do
        payload = {
          user: {
            name: 'Foo2'
          }
        }

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(403)

          @user.reload
          @user.username.should_not eq 'Foo2'
        end
      end

      it 'does not update fields not present in the user hash' do
        payload = {
          user: {
            name: 'Foo',
            last_name: 'Bar',
            website: 'https://carto.rocks',
            password_confirmation: 'foobarbaz'
          }
        }
        old_description = @user.description
        old_location = @user.location
        old_twitter_username = @user.twitter_username

        put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(200)

          expect(response.body[:name]).to eq('Foo')
          expect(response.body[:last_name]).to eq('Bar')
          expect(response.body[:website]).to eq('https://carto.rocks')
          expect(response.body[:description]).to eq(old_description)
          expect(response.body[:location]).to eq(old_location)
          expect(response.body[:twitter_username]).to eq(old_twitter_username)
        end
      end

      it 'sets field to nil if key is present in the hash with a nil value' do
        fields_to_check = [
          :name, :last_name, :website, :description, :location, :twitter_username,
          :disqus_shortname, :available_for_hire
        ]

        fields_to_check.each do |field|
          payload = { user: { field => nil,
                              password_confirmation: 'foobarbaz' } }

          put_json api_v3_users_update_me_url(url_options), payload, @headers do |response|
            expect(response.status).to eq(200)
            @user.refresh
            expect(@user.values[field]).to be_nil
          end
        end
      end

      it 'returns 401 if user is not logged in' do
        payload = { user: { name: 'Foo',
                            password_confirmation: 'foobarbaz' } }

        put_json api_v3_users_update_me_url(url_options.except(:api_key)), payload, @headers do |response|
          expect(response.status).to eq(401)
        end
      end
    end
  end

  describe 'delete_me' do
    before(:each) do
      @user = create(:user, password: 'foobarbaz', password_confirmation: 'foobarbaz')
      User.any_instance.stubs(:delete_in_central)
    end

    let(:url_options) do
      {
        user_domain: @user.username,
        api_key: @user.api_key
      }
    end

    it 'deletes the authenticated user' do
      payload = { deletion_password_confirmation: 'foobarbaz' }

      delete_json api_v3_users_delete_me_url(url_options), payload, @headers do |response|
        expect(response.status).to eq(200)
        expect(Carto::User.exists?(@user.id)).to be_false
      end
    end

    it 'deletes the authenticated user even when locked' do
      @user.update(state: 'locked')

      payload = { deletion_password_confirmation: 'foobarbaz' }

      delete_json api_v3_users_delete_me_url(url_options), payload, @headers do |response|
        expect(response.status).to eq(200)
        expect(Carto::User.exists?(@user.id)).to be_false
      end
    end

    context 'failures in deletion' do
      after(:each) do
        @user.destroy
      end

      it 'gives an error if deletion password confirmation is invalid' do
        payload = { deletion_password_confirmation: 'idontknow' }

        delete_json api_v3_users_delete_me_url(url_options), payload, @headers do |response|
          expect(response.status).to eq(400)
          expect(response.body[:message]).to eq("Error deleting user: Password does not match")
        end
      end

      it 'returns 401 if user is not logged in' do
        delete_json api_v3_users_delete_me_url(url_options.except(:api_key)), @headers do |response|
          expect(response.status).to eq(401)
        end
      end
    end
  end

end
