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

    it 'does not display out of quota message if there is remaining quota' do
      @organization.unassigned_quota.should > @organization.default_quota_in_bytes

      get organization_auth_url(user_domain: @org_user_owner.username)

      response.status.should eq 200
      response.body.should_not include("Your organization has run out of quota")
    end

    it 'displays out of quota message if there is no remaining quota' do
      old_remaining_quota = @organization.unassigned_quota
      new_quota = (@organization.quota_in_bytes - old_remaining_quota) + (@organization.default_quota_in_bytes / 2)
      @organization.reload
      @org_user_owner.reload
      @organization.quota_in_bytes = new_quota
      @organization.save

      get organization_auth_url(user_domain: @org_user_owner.username)

      response.status.should eq 200
      response.body.should include("Your organization has run out of quota")
    end
  end
end
