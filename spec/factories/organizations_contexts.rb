require_relative '../support/factories/users'
require 'helpers/unique_names_helper'

class TestUserFactory

  include CartoDB::Factories

end

shared_context 'organization with users helper' do
  include CacheHelper
  include CartoDB::Factories
  include UniqueNamesHelper

  include_context 'database configuration'

  before(:each) do
    bypass_named_maps
  end

  def test_organization
    Carto::Organization.create!(
      name: unique_name('org'),
      quota_in_bytes: 1_234_567_890,
      seats: 15,
      viewer_seats: 15,
      builder_enabled: false,
      geocoder_provider: 'heremaps',
      isolines_provider: 'heremaps',
      routing_provider: 'heremaps'
    )
  end

  before(:all) do
    @helper = TestUserFactory.new
    @organization = test_organization
    @organization.save
    @organization_2 = test_organization
    @organization_2.save

    @org_user_owner = @helper.create_owner(@organization)

    @org_user_1 = @helper.create_test_user(unique_name('user'), @organization)
    @org_user_2 = @helper.create_test_user(unique_name('user'), @organization)

    @organization.reload

    @carto_organization = @organization
    @carto_org_user_owner = @org_user_owner.carto_user
    @carto_org_user_1 = @org_user_1.carto_user
    @carto_org_user_2 = @org_user_2.carto_user
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @org_user_owner
    delete_user_data @org_user_1
    delete_user_data @org_user_2
  end

  after(:all) do
    bypass_named_maps
    delete_user_data @org_user_owner if @org_user_owner
    @organization.destroy_cascade

    @organization_2.destroy_cascade
  end

end
