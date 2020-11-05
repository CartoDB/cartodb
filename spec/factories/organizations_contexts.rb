require_relative '../support/factories/users'
require 'helpers/unique_names_helper'

class TestUserFactory

  include CartoDB::Factories

end

module TableSharing

  def share_table_with_user(table, user, access: Carto::Permission::ACCESS_READONLY)
    vis = CartoDB::Visualization::Member.new(id: table.table_visualization.id).fetch
    per = vis.permission
    per.set_user_permission(user, access)
    per.save
    per.reload
  end

  def share_visualization_with_user(visualization, user, access: Carto::Permission::ACCESS_READONLY)
    vis = CartoDB::Visualization::Member.new(id: visualization.id).fetch
    per = vis.permission
    per.set_user_permission(user, access)
    per.save
    per.reload
  end

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

  def share_table(table, owner, user)
    bypass_named_maps
    headers = { 'CONTENT_TYPE' => 'application/json' }
    perm_id = table.table_visualization.permission.id

    request_payload = {
      acl: [
        {
          type: Carto::Permission::TYPE_USER,
          entity: { id: user.id },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
    }.to_json
    put(
      api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id),
      request_payload,
      headers
    )
    response.status.should == 200
  end

  def share_table_with_organization(table, owner, organization)
    bypass_named_maps
    headers = {'CONTENT_TYPE'  => 'application/json'}
    perm_id = table.table_visualization.permission.id

    params = { acl: [{ type: Carto::Permission::TYPE_ORGANIZATION,
                       entity: { id: organization.id },
                       access: Carto::Permission::ACCESS_READONLY
                     }]
             }
    url = api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id)
    put url, params.to_json, headers
    last_response.status.should == 200
  end

  def share_visualization(visualization, user, access = Carto::Permission::ACCESS_READONLY)
    shared_entity = Carto::SharedEntity.create(
      recipient_id: user.id,
      recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id: visualization.id,
      entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )

    owner = visualization.user
    perm_id = visualization.permission.id
    params = { acl: [{ type: Carto::Permission::TYPE_USER,
                       entity: { id: user.id },
                       access: access
                     }]
             }
    url = api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id)
    put_json url, params do |response|
      response.status.should == 200
    end
  end
end
