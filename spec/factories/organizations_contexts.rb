# encoding: utf-8
require_relative '../support/factories/users'

class TestUserFactory
  include CartoDB::Factories

end

shared_context 'organization with users helper' do
  include CacheHelper
  include CartoDB::Factories
  include_context 'database configuration'

  before(:each) do
    bypass_named_maps
  end

  def test_organization
    organization = Organization.new
    organization.name = org_name = "org#{rand(9999)}"
    organization.quota_in_bytes = 1234567890
    organization.seats = 15
    organization
  end

  before(:all) do
    @helper = TestUserFactory.new
    @organization = test_organization
    @organization.save
    @organization_2 = test_organization
    @organization_2.save

    @org_user_owner = @helper.create_owner(@organization)

    @org_user_1 = @helper.create_test_user("a#{random_username}", @organization)
    @org_user_2 = @helper.create_test_user("b#{random_username}", @organization)

    @organization.reload

    @carto_organization = Carto::Organization.find(@organization.id)
    @carto_org_user_owner = Carto::User.find(@org_user_owner.id)
    @carto_org_user_1 = Carto::User.find(@org_user_1.id)
    @carto_org_user_2 = Carto::User.find(@org_user_2.id)
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
    headers = {'CONTENT_TYPE'  => 'application/json'}
    perm_id = table.table_visualization.permission.id

    put api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id),
        { acl: [{
                 type: CartoDB::Permission::TYPE_USER,
                 entity: {
                   id:   user.id,
                 },
                 access: CartoDB::Permission::ACCESS_READONLY
               }]}.to_json, headers
    response.status.should == 200
  end

  def share_table_with_organization(table, owner, organization)
    bypass_named_maps
    headers = {'CONTENT_TYPE'  => 'application/json'}
    perm_id = table.table_visualization.permission.id

    params = { acl: [{ type: CartoDB::Permission::TYPE_ORGANIZATION,
                       entity: { id: organization.id },
                       access: CartoDB::Permission::ACCESS_READONLY
                     }]
             }
    url = api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id)
    put url, params.to_json, headers
    last_response.status.should == 200
  end

  def share_visualization(visualization, user, access = CartoDB::Permission::ACCESS_READONLY)
    shared_entity = CartoDB::SharedEntity.new(
      recipient_id: user.id,
      recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id: visualization.id,
      entity_type: CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )
    shared_entity.save

    owner = visualization.user
    perm_id = visualization.permission.id
    params = { acl: [{ type: CartoDB::Permission::TYPE_USER,
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
