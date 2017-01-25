require_relative '../../spec_helper_min'
require_relative '../../factories/organizations_contexts'

describe Admin::OrganizationsController do
  include Warden::Test::Helpers
  include_context 'organization with users helper'

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
        response.body.should_not include("Your organization has run out of quota")
        response.body.should_not include("Your organization has run out of seats")
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
        response.body.should include("Your organization has run out of quota")

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
        response.body.should include("Your organization has run out of seats")

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
        response.body.should_not include("Your organization has run out of quota")
        response.body.should_not include("Your organization has run out of seats")

        @organization.quota_in_bytes = old_quota_in_bytes
        @organization.seats = old_seats
        @organization.save
      end
    end
  end
end
