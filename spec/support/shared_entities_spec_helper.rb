module SharedEntitiesSpecHelper

  extend ActiveSupport::Concern

  def share_table(table, user)
    permission = table.table_visualization.permission
    permission.update!(
      acl: [
        {
          type: Carto::Permission::TYPE_USER,
          entity: { id: user.id },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
    )
  end

  def http_share_table(table, owner, user)
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

  def share_table_with_organization(table, owner, organization)
    bypass_named_maps
    headers = { 'CONTENT_TYPE' => 'application/json' }
    perm_id = table.table_visualization.permission.id

    params = {
      acl: [
        {
          type: Carto::Permission::TYPE_ORGANIZATION,
          entity: { id: organization.id },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
    }
    url = api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id)
    put url, params.to_json, headers
    last_response.status.should == 200
  end

  def share_visualization(visualization, user, access = Carto::Permission::ACCESS_READONLY)
    Carto::SharedEntity.create(
      recipient_id: user.id,
      recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id: visualization.id,
      entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )

    owner = visualization.user
    perm_id = visualization.permission.id
    params = {
      acl: [
        {
          type: Carto::Permission::TYPE_USER,
          entity: { id: user.id },
          access: access
        }
      ]
    }
    url = api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id)
    put_json url, params do |response|
      response.status.should == 200
    end
  end

end
