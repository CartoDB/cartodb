require_relative '../../../spec_helper'
require_relative '.././../../factories/organizations_contexts'
require_relative '.././../../factories/visualization_creation_helpers'
require_relative '../../../../app/controllers/carto/api/database_groups_controller'

# cURL samples:
# - Create group: curl -v --user extension:elephant -H "Content-Type: application/json" -X POST -d '{ "name": "Group 2", "database_role": "DELETEME_FAKE_ROLE" }' http://localhost.lan:3000/api/v1/databases/cartodb_dev_user_3a03e626-c26c-4469-afea-a800fd813e1c_db/groups
# - Delete group: curl -v --user extension:elephant -H "Content-Type: application/json" -X DELETE http://localhost.lan:3000/api/v1/databases/cartodb_dev_user_3a03e626-c26c-4469-afea-a800fd813e1c_db/groups/Group%202
#
# Examples for staging: curl -v --user USER:PASS -H "Content-Type: application/json" -H "X-Forwarded-Proto: https" -X POST -d '{ "name": "MyGroup", "database_role": "DELETEME_FAKE_ROLE" }' http://haproxy.service.consul:8888/api/v1/databases/cartodb_staging_user_21a66689-0d8a-4512-b8e9-1fb8a93f2785_db/groups
# Delete: curl -v --user USER:PASS -H "Content-Type: application/json" -H "X-Forwarded-Proto: https" -X DELETE http://haproxy.service.consul:8888/api/v1/databases/cartodb_staging_user_21a66689-0d8a-4512-b8e9-1fb8a93f2785_db/groups/MyGroup

describe Carto::Api::DatabaseGroupsController do
  include_context 'organization with users helper'

  describe 'Groups management', :order => :defined do

    it "Throws 401 error without http auth" do
      post api_v1_databases_group_create_url(user_domain: @org_user_owner.username, database_name: @organization.database_name), {}, http_json_headers
      response.status.should == 401
    end

    it '#creates a new group from name and role, and initializes display_name as name' do
      group_information = { name: 'org_group', database_role: 'g_org_database_group' }
      post api_v1_databases_group_create_url(database_name: @organization.database_name), group_information.to_json, org_metadata_api_headers
      response.status.should == 200
      group = Carto::Group.where(organization_id: @organization.id, database_role: group_information[:database_role], name: group_information[:name], display_name: group_information[:name]).first
      group.should_not be_nil
    end

    it '#creates return 409 if a group with that data has already been created' do
      group_information = { name: 'org_group', database_role: 'g_org_database_group' }
      post api_v1_databases_group_create_url(database_name: @organization.database_name), group_information.to_json, org_metadata_api_headers
      response.status.should == 409
    end

    it '#rename a new group from name and role' do
      group = @organization.groups.first
      group_information = { name: 'org_group_2', database_role: 'g_org_database_group_2' }
      put api_v1_databases_group_update_url(database_name: group.database_name, old_name: group.name), group_information.to_json, org_metadata_api_headers
      response.status.should == 200
      updated_group = Carto::Group.find(group.id)
      updated_group.should_not be_nil
      updated_group.name.should eq group_information[:name]
      updated_group.database_role.should eq group_information[:database_role]
      updated_group.display_name.should eq group.display_name
    end

    it '#rename triggers 409 if it looks like renaming already occurred: existing new name, nonexisting old name' do
      group_old_information = { name: 'org_group', database_role: 'g_org_database_group' }
      group_new_information = { name: 'org_group_2', database_role: 'g_org_database_group_2' }
      put api_v1_databases_group_update_url(database_name: @organization.database_name, old_name: group_old_information[:name]), group_new_information.to_json, org_metadata_api_headers
      response.status.should == 409
    end

    it '#rename triggers 500 if renaming can\'t be done and there is no previous match' do
      group_old_information = { name: 'org_group', database_role: 'g_org_database_group' }
      group_new_information = { name: 'org_group_2', database_role: 'g_org_database_group_WRONG' }
      put api_v1_databases_group_update_url(database_name: @organization.database_name, old_name: group_old_information[:name]), group_new_information.to_json, org_metadata_api_headers
      response.status.should == 500
    end

    it '#add_users from username' do
      group = @organization.groups.first
      user_information = { username: @org_user_1.username }
      post api_v1_databases_group_add_users_url(database_name: group.database_name, name: group.name), user_information.to_json, org_metadata_api_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should include(@org_user_1.username)
    end

    it '#add_users returns 409 if username is already added' do
      group = @organization.groups.first
      user_information = { username: @org_user_1.username }
      post api_v1_databases_group_add_users_url(database_name: group.database_name, name: group.name), user_information.to_json, org_metadata_api_headers
      response.status.should == 409
    end

    it '#update_permission returns 404 for visualizations' do
      v = create(:carto_visualization, user: @carto_org_user_1)

      group = @organization.groups.first
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(
        database_name: group.database_name,
        name: group.name,
        username: @org_user_1.username,
        table_name: v.name), permission.to_json, org_metadata_api_headers
      response.status.should == 404
    end

    it '#update_permission granting read to a table' do
      bypass_named_maps
      @table_user_2 = create_table_with_options(@org_user_2)

      group = @organization.groups.first
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_2.username, table_name: @table_user_2['name']), permission.to_json, org_metadata_api_headers
      response.status.should == 200

      permission = ::Visualization::Member.new(id: @table_user_2['table_visualization'][:id]).fetch.permission
      permission.should_not be_nil

      expected_acl = [
        {
          type: Carto::Permission::TYPE_GROUP,
          entity: { id: group.id, name: group.name },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      permission.to_poro[:acl].should == expected_acl

      # URL generation for users of the granted group not table owners
      user = group.users.first
      user.id.should_not == @org_user_2.id
      vis_id = @table_user_2['table_visualization'][:id]
      # subdomain test simulation
      host = "#{user.organization.name}.localhost.lan"
      url = api_v1_visualizations_show_url(user_domain: user.username, id: vis_id, api_key: user.api_key).gsub('www.example.com', host)
      get_json url, {}, http_json_headers do |response|
        response.status.should == 200

        [
          "http://#{host}:#{Cartodb.config[:http_port]}/user/#{user.username}/tables/#{@org_user_2.username}.#{@table_user_2['name']}",
          "http://#{host}:#{Cartodb.config[:http_port]}/u/#{user.username}/tables/#{@org_user_2.username}.#{@table_user_2['name']}",
        ].should include(response.body[:url])
      end
    end

    it '#update_permission granting write to a table' do
      bypass_named_maps
      @table_user_1 = create_table_with_options(@org_user_1)

      group = @organization.groups.first
      # First read, then write, to ensure there're no duplicates
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission.to_json, org_metadata_api_headers
      response.status.should == 200

      permission = { 'access' => 'w' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission.to_json, org_metadata_api_headers
      response.status.should == 200

      permission = ::Visualization::Member.new(id: @table_user_1['table_visualization'][:id]).fetch.permission
      permission.should_not be_nil

      expected_acl = [
        {
          type: Carto::Permission::TYPE_GROUP,
          entity: { id: group.id, name: group.name },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      permission.to_poro[:acl].should == expected_acl
    end

    it '#destroy_permission to a table' do
      bypass_named_maps
      @table_user_1 = create_table_with_options(@org_user_1)

      group = @organization.groups.first
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission.to_json, org_metadata_api_headers
      response.status.should == 200

      expected_acl = []

      delete api_v1_databases_group_destroy_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), '', org_metadata_api_headers
      response.status.should == 200
      permission = ::Visualization::Member.new(id: @table_user_1['table_visualization'][:id]).fetch.permission
      permission.to_poro[:acl].should == expected_acl

      # Check it doesn't duplicate
      delete api_v1_databases_group_destroy_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), '', org_metadata_api_headers
      response.status.should == 404
    end

    it '#update_permission granting read on a table to organization, group and user do not duplicate count' do
      bypass_named_maps
      @table_user_2 = create_table_with_options(@org_user_2)
      request_payload = {
        acl: [
          {
            type: Carto::Permission::TYPE_USER,
            entity: { id: @org_user_1.id },
            access: Carto::Permission::ACCESS_READONLY
          },
          {
            type: Carto::Permission::TYPE_ORGANIZATION,
            entity: { id: @organization.id },
            access: Carto::Permission::ACCESS_READONLY
          }
        ]
      }.to_json
      permission_id = @table_user_2['table_visualization'][:permission][:id]
      request_url_params = { user_domain: @org_user_2.username, api_key: @org_user_2.api_key, id: permission_id }
      put api_v1_permissions_update_url(request_url_params), request_payload, http_json_headers
      response.status.should == 200

      group = @organization.groups.first
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_2.username, table_name: @table_user_2['name']), permission.to_json, org_metadata_api_headers
      response.status.should == 200

      get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at', exclude_shared: false, shared: 'only'), http_json_headers
      body = JSON.parse(response.body).symbolize_keys
      body[:total_entries].should eq 1
      body[:visualizations].count.should eq 1
      body[:total_shared].should eq 1
    end

    it '#remove_users from username' do
      group = @organization.groups.first
      username = group.users.first.username
      delete api_v1_databases_group_remove_users_url(database_name: group.database_name, name: group.name, username: username), {}, org_metadata_api_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should_not include(username)
    end

    it '#remove_users from username throws 404 if user is not found' do
      group = @organization.groups.first
      username = @org_user_1.username
      delete api_v1_databases_group_remove_users_url(database_name: group.database_name, name: group.name, username: username), {}, org_metadata_api_headers
      response.status.should == 404
    end

    it '#add_users from username accepts batches' do
      group = @organization.groups.first
      user_information = { users: [ @org_user_1.username, @org_user_2.username ] }
      post api_v1_databases_group_add_users_url(database_name: group.database_name, name: group.name), user_information.to_json, org_metadata_api_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should include(@org_user_1.username)
      group.users.collect(&:username).should include(@org_user_2.username)
    end

    it '#remove_users from username accepts batches' do
      group = @organization.groups.first
      usernames = group.users.collect(&:username)
      delete_json api_v1_databases_group_remove_users_url(database_name: group.database_name, name: group.name), { users: usernames }, org_metadata_api_headers
      response.status.should == 200
      group.reload
      usernames.map { |username|
        group.users.collect(&:username).should_not include(username)
      }
    end

    it '#destroy an existing group' do
      group = @organization.groups.first
      delete api_v1_databases_group_destroy_url(database_name: group.database_name, name: group.name), nil, org_metadata_api_headers
      response.status.should == 204
      Carto::Group.where(id: group.id).first.should be_nil
    end

    it '#destroy a nonexisting group returns 404' do
      delete api_v1_databases_group_destroy_url(database_name: @organization.database_name, name: 'org_group'), nil, org_metadata_api_headers
      response.status.should == 404
    end

  end
end
