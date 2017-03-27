require_relative '../../spec_helper_min'
require_relative '../../factories/organizations_contexts'

describe Admin::OrganizationsController do
  include Warden::Test::Helpers
  include_context 'organization with users helper'

  let(:out_of_quota_message) { "Your organization has run out of quota" }
  let(:out_of_seats_message) { "Your organization has run out of seats" }

  describe '#auth' do
    before(:each) do
      host! "#{@organization.name}.localhost.lan"
      login_as(@org_user_owner, scope: @org_user_owner.username)
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

  describe 'notifications' do
    before(:each) do
      host! "#{@organization.name}.localhost.lan"
      login_as(@org_user_owner, scope: @org_user_owner.username)
    end

    describe '#notifications' do
      it 'displays last notification' do
        body = 'Free meal today'
        FactoryGirl.create(:notification, organization: @carto_organization, body: body)
        get organization_notifications_admin_url(user_domain: @org_user_owner.username)
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
        post new_organization_notification_admin_url(user_domain: @org_user_owner.username), carto_notification: params
        response.status.should eq 302
        flash[:success].should eq 'Notification sent!'
        notification = @carto_organization.reload.notifications.first
        notification.body.should eq params[:body]
        notification.recipients.should eq params[:recipients]
        notification.icon.should eq Carto::Notification::ICON_WARNING
      end
    end

    describe '#destroy_notification' do
      it 'destroys a notification' do
        notification = @carto_organization.notifications.first
        delete destroy_organization_notification_admin_url(user_domain: @org_user_owner.username, id: notification.id)
        response.status.should eq 302
        flash[:success].should eq 'Notification was successfully deleted!'
        @carto_organization.reload.notifications.should_not include(notification)
      end
    end
  end
end
