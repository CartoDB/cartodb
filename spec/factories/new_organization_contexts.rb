# This is an intermediate steps towards replacing the shared state introduced by the old
# helper.
# PLEASE DON'T USE THIS FOR NEW SPECS
shared_context 'new organization with users helper' do
  before do
    @organization = create(:organization_with_users)
    @organization_2 = create(:organization_with_users)
    @org_user_owner = @organization.owner

    @org_user_1 = @organization.users.first.sequel_user
    @org_user_2 = @organization.users.second.sequel_user

    @carto_organization = @organization
    @carto_org_user_owner = @org_user_owner.carto_user

    @carto_org_user_1 = @org_user_1.carto_user
    @carto_org_user_2 = @org_user_2.carto_user
  end
end
