require_relative '../../spec_helper_min'
require_relative '../../factories/organizations_contexts'

describe Admin::OrganizationsController do
  include Warden::Test::Helpers
  include_context 'organization with users helper'

  let(:out_of_quota_message) { "Your organization has run out of quota" }
  let(:out_of_seats_message) { "Your organization has run out of seats" }

  before(:all) do
    @org_user_2.org_admin = true
    @org_user_2.save
  end

  describe '#settings' do
    let(:payload) do
      {
        organization: { color: '#ff0000' }
      }
    end

    let(:payload_password) do
      {
        organization: { color: '#ff0000' },
        password_confirmation: @org_user_owner.password
      }
    end

    let(:payload_wrong_password) do
      {
        organization: { color: '#ff0000' },
        password_confirmation: 'prapra'
      }
    end

    before(:each) do
      host! "#{@organization.name}.localhost.lan"
      Organization.any_instance.stubs(:update_in_central).returns(true)
    end

    it 'cannot be accessed by non owner users' do
      login_as(@org_user_1, scope: @org_user_1.username)
      get organization_settings_url(user_domain: @org_user_1.username)
      response.status.should eq 404

      login_as(@org_user_2, scope: @org_user_2.username)
      get organization_settings_url(user_domain: @org_user_2.username)
      response.status.should eq 404
    end

    it 'cannot be updated by non owner users' do
      login_as(@org_user_1, scope: @org_user_1.username)
      put organization_settings_update_url(user_domain: @org_user_1.username), payload
      response.status.should eq 404

      login_as(@org_user_2, scope: @org_user_2.username)
      put organization_settings_update_url(user_domain: @org_user_2.username), payload
      response.status.should eq 404
    end

    it 'can be accessed by owner user' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      get organization_settings_url(user_domain: @org_user_owner.username)
      response.status.should eq 200
    end

    it 'can be updated by owner user' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_settings_update_url(user_domain: @org_user_owner.username), payload_password
      response.status.should eq 302
    end

    it 'fails to update if no password_confirmation' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_settings_update_url(user_domain: @org_user_owner.username), payload
      response.status.should eq 403
      response.body.should match /Confirmation password sent does not match your current password/
    end

    it 'fails to update if wrong password_confirmation' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_settings_update_url(user_domain: @org_user_owner.username), payload_wrong_password
      response.status.should eq 403
      response.body.should match /Confirmation password sent does not match your current password/
    end
  end

  describe '#regenerate_api_keys' do
    it 'regenerate api keys for all org users' do
      api_key = @carto_org_user_owner.api_keys.create_regular_key!(name: 'wadus', grants: [{ type: 'apis', apis: [] }])
      @organization.engine_enabled = true
      @organization.save
      host! "#{@organization.name}.localhost.lan"
      login_as(@org_user_owner, scope: @org_user_owner.username)
      post regenerate_organization_users_api_key_url(
        user_domain: @org_user_owner.username,
        password_confirmation: @org_user_owner.password
      )
      response.status.should eq 302

      @organization.users.each do |u|
        old_api_key = u.api_key
        u.reload
        expect(u.api_key).to_not eq old_api_key
      end
      expect { api_key.reload }.to(change { api_key.token })
      api_key.destroy
    end
  end

  describe '#delete' do
    before(:all) do
      @delete_org = test_organization
      @delete_org.save

      helper = TestUserFactory.new
      @delete_org_owner = helper.create_owner(@delete_org)

      @delete_org_user1 = @helper.create_test_user(unique_name('user'), @delete_org)
    end

    after(:all) do
      @delete_org.destroy_cascade if Carto::Organization.exists?(@delete_org.id)
    end

    before(:each) do
      host! "#{@delete_org.name}.localhost.lan"
      Organization.any_instance.stubs(:update_in_central).returns(true)
    end

    it 'cannot be accessed by non owner users' do
      login_as(@delete_org_user1, scope: @delete_org_user1.username)
      delete organization_destroy_url(user_domain: @delete_org_user1.username)
      response.status.should eq 404
    end

    describe 'as owner' do
      before(:each) do
        login_as(@delete_org_owner, scope: @delete_org_owner.username)
      end

      it 'returns 400 if no password confirmation is provided' do
        delete organization_destroy_url(user_domain: @delete_org_owner.username)
        response.status.should eq 400
        response.body.should include("Password doesn't match")
      end

      it 'returns 400 if password confirmation is wrong' do
        payload = { deletion_password_confirmation: @delete_org_owner.password + 'wadus' }
        delete organization_destroy_url(user_domain: @delete_org_owner.username), payload
        response.status.should eq 400
      end

      it 'deletes organization and redirects if passwords match' do
        payload = { deletion_password_confirmation: @delete_org_owner.password }
        delete organization_destroy_url(user_domain: @delete_org_owner.username), payload
        response.status.should eq 302
        Carto::Organization.exists?(@delete_org.id).should be_false
      end
    end
  end

  describe '#auth' do
    let(:payload) do
      {
        organization: {
          whitelisted_email_domains: '',
          auth_username_password_enabled: true,
          auth_google_enabled: true,
          auth_github_enabled: true,
          strong_passwords_enabled: false,
          password_expiration_in_d: 1
        }
      }
    end

    let(:payload_password) do
      {
        organization: {
          whitelisted_email_domains: '',
          auth_username_password_enabled: true,
          auth_google_enabled: true,
          auth_github_enabled: true,
          strong_passwords_enabled: false,
          password_expiration_in_d: 1
        },
        password_confirmation: @org_user_owner.password
      }
    end

    let(:payload_wrong_password) do
      {
        organization: {
          whitelisted_email_domains: '',
          auth_username_password_enabled: true,
          auth_google_enabled: true,
          auth_github_enabled: true,
          strong_passwords_enabled: false
        },
        password_confirmation: 'prapra'
      }
    end

    before(:each) do
      host! "#{@organization.name}.localhost.lan"
      login_as(@org_user_owner, scope: @org_user_owner.username)
      Organization.any_instance.stubs(:update_in_central).returns(true)
    end

    it 'cannot be accessed by non owner users' do
      login_as(@org_user_1, scope: @org_user_1.username)
      get organization_auth_url(user_domain: @org_user_1.username)
      response.status.should eq 404

      login_as(@org_user_2, scope: @org_user_2.username)
      get organization_auth_url(user_domain: @org_user_2.username)
      response.status.should eq 404
    end

    it 'cannot be updated by non owner users' do
      login_as(@org_user_1, scope: @org_user_1.username)
      put organization_auth_update_url(user_domain: @org_user_1.username), payload
      response.status.should eq 404

      login_as(@org_user_2, scope: @org_user_2.username)
      put organization_auth_update_url(user_domain: @org_user_2.username), payload
      response.status.should eq 404
    end

    it 'can be accessed by owner user' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      get organization_auth_url(user_domain: @org_user_owner.username)
      response.status.should eq 200
    end

    it 'can be updated by owner user' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_auth_update_url(user_domain: @org_user_owner.username), payload_password
      response.status.should eq 302
    end

    it 'cannot be updated by owner user if missing password_confirmation' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_auth_update_url(user_domain: @org_user_owner.username), payload
      response.status.should eq 403
      response.body.should match /Confirmation password sent does not match your current password/
    end

    it 'cannot be updated by owner user if wrong password_confirmation' do
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_auth_update_url(user_domain: @org_user_owner.username), payload_wrong_password
      response.status.should eq 403
      response.body.should match /Confirmation password sent does not match your current password/
    end

    it 'updates password_expiration_in_d' do
      @organization.password_expiration_in_d = nil
      @organization.save

      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_auth_update_url(user_domain: @org_user_owner.username), payload_password
      response.status.should eq 302
      @organization.reload
      @organization.password_expiration_in_d.should eq 1

      payload_password[:organization][:password_expiration_in_d] = ''
      host! "#{@organization.name}.localhost.lan"
      login_as(@org_user_owner, scope: @org_user_owner.username)
      put organization_auth_update_url(user_domain: @org_user_owner.username), payload_password
      response.status.should eq 302
      @organization.reload
      @organization.password_expiration_in_d.should be_nil
    end

    describe 'signup enabled' do
      before(:all) do
        @organization.whitelisted_email_domains = ['carto.com']
        @organization.save
      end

      before(:each) do
        @organization.signup_page_enabled.should eq true
      end

      it 'does not display out warning messages if organization signup would work' do
        @organization.unassigned_quota.should > @organization.default_quota_in_bytes

        get organization_auth_url(user_domain: @org_user_owner.username)

        response.status.should eq 200
        response.body.should_not include(out_of_quota_message)
        response.body.should_not include(out_of_seats_message)
      end

      it 'displays out of quota message if there is no remaining quota' do
        old_quota_in_bytes = @organization.quota_in_bytes

        old_remaining_quota = @organization.unassigned_quota
        new_quota = (@organization.quota_in_bytes - old_remaining_quota) + (@organization.default_quota_in_bytes / 2)
        @organization.reload
        @org_user_owner.reload
        @organization.quota_in_bytes = new_quota
        @organization.save

        get organization_auth_url(user_domain: @org_user_owner.username)

        response.status.should eq 200
        response.body.should include(out_of_quota_message)

        @organization.quota_in_bytes = old_quota_in_bytes
        @organization.save
      end

      it 'displays out of seats message if there are no seats left' do
        old_seats = @organization.seats

        new_seats = @organization.seats - @organization.remaining_seats
        @organization.reload
        @org_user_owner.reload
        @organization.seats = new_seats
        @organization.save

        get organization_auth_url(user_domain: @org_user_owner.username)

        response.status.should eq 200
        response.body.should include(out_of_seats_message)

        @organization.seats = old_seats
        @organization.save
      end
    end

    describe 'signup disabled' do
      before(:all) do
        @organization.whitelisted_email_domains = []
        @organization.save
      end

      before(:each) do
        @organization.signup_page_enabled.should eq false
      end

      it 'does not display out warning messages even without quota and seats' do
        old_quota_in_bytes = @organization.quota_in_bytes
        old_seats = @organization.seats

        @organization.reload
        @org_user_owner.reload

        @organization.seats = @organization.assigned_seats
        @organization.quota_in_bytes = @organization.assigned_quota + 1
        @organization.save

        get organization_auth_url(user_domain: @org_user_owner.username)

        response.status.should eq 200
        response.body.should_not include(out_of_quota_message)
        response.body.should_not include(out_of_seats_message)

        @organization.quota_in_bytes = old_quota_in_bytes
        @organization.seats = old_seats
        @organization.save
      end
    end
  end

  shared_examples_for 'notifications' do
    before(:each) do
      host! "#{@organization.name}.localhost.lan"
      login_as(@admin_user, scope: @admin_user.username)
    end

    describe '#notifications' do
      it 'displays last notification' do
        body = 'Free meal today'
        FactoryGirl.create(:notification, organization: @carto_organization, body: body)
        get organization_notifications_admin_url(user_domain: @admin_user.username)
        response.status.should eq 200
        response.body.should include(body)
      end
    end

    describe '#new_notification' do
      it 'creates a new notification' do
        params = {
          body: 'the body',
          recipients: Carto::Notification::RECIPIENT_ALL
        }
        post new_organization_notification_admin_url(
          user_domain: @admin_user.username
        ), carto_notification: params, password_confirmation: @admin_user.password
        response.status.should eq 302
        flash[:success].should eq 'Notification sent!'
        notification = @carto_organization.reload.notifications.first
        notification.body.should eq params[:body]
        notification.recipients.should eq params[:recipients]
        notification.icon.should eq Carto::Notification::ICON_ALERT
      end

      it 'does not create a new notification if wrong password_confirmation' do
        params = {
          body: 'the body wrong',
          recipients: Carto::Notification::RECIPIENT_ALL
        }
        post new_organization_notification_admin_url(
          user_domain: @admin_user.username
        ), carto_notification: params, password_confirmation: 'prapra'
        response.status.should eq 403
        response.body.should match /Confirmation password sent does not match your current password/
        notification = @carto_organization.reload.notifications.first
        notification.body.should_not eq params[:body]
      end

      it 'does not create a new notification if missing password_confirmation' do
        params = {
          body: 'the body missing',
          recipients: Carto::Notification::RECIPIENT_ALL
        }
        post new_organization_notification_admin_url(user_domain: @admin_user.username), carto_notification: params
        response.status.should eq 403
        response.body.should match /Confirmation password sent does not match your current password/
        notification = @carto_organization.reload.notifications.first
        notification.body.should_not eq params[:body]
      end
    end

    describe '#destroy_notification' do
      it 'destroys a notification' do
        notification = @carto_organization.notifications.first
        delete destroy_organization_notification_admin_url(user_domain: @admin_user.username, id: notification.id)
        response.status.should eq 302
        flash[:success].should eq 'Notification was successfully deleted!'
        @carto_organization.reload.notifications.should_not include(notification)
      end
    end
  end

  describe 'with organization owner' do
    it_behaves_like 'notifications' do
      before(:all) do
        @admin_user = @org_user_owner
      end
    end
  end

  describe 'with organization admin' do
    it_behaves_like 'notifications' do
      before(:all) do
        @admin_user = @org_user_2
      end
    end
  end
end
