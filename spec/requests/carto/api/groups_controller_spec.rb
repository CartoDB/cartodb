# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '.././../../factories/organizations_contexts'
require_relative '.././../../factories/visualization_creation_helpers'
require_relative '../../../../app/controllers/carto/api/groups_controller'

describe Carto::Api::GroupsController do
  include_context 'organization with users helper'

  describe 'Groups management', :order => :defined do

    before(:all) do
      @no_auth_headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
    end

    before(:each) do
      @carto_organization = Carto::Organization.find(@organization.id)
    end

    it "Throws 401 error without http auth" do
      post api_v1_databases_group_create_url(database_name: @carto_organization.database_name), {}, @no_auth_headers
      response.status.should == 401
    end

    it '#creates a new group from name and role, and initializes display_name as name' do
      group_information = { name: 'org_group', database_role: 'g_org_database_group' }
      post api_v1_databases_group_create_url(database_name: @carto_organization.database_name), group_information, default_headers
      response.status.should == 200
      group = Carto::Group.where(organization_id: @carto_organization.id, database_role: group_information[:database_role], name: group_information[:name], display_name: group_information[:name]).first
      group.should_not be_nil
    end

    it '#creates return 409 if a group with that data has already been created' do
      group_information = { name: 'org_group', database_role: 'g_org_database_group' }
      post api_v1_databases_group_create_url(database_name: @carto_organization.database_name), group_information, default_headers
      response.status.should == 409
    end

    it '#rename a new group from name and role' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      group_information = { name: 'org_group_2', database_role: 'g_org_database_group_2' }
      put api_v1_databases_group_update_url(database_name: group.database_name, old_name: group.name), group_information, default_headers
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
      put api_v1_databases_group_update_url(database_name: @carto_organization.database_name, old_name: group_old_information[:name]), group_new_information, default_headers
      response.status.should == 409
    end

    it '#rename triggers 500 if renaming can\'t be done and there is no previous match' do
      group_old_information = { name: 'org_group', database_role: 'g_org_database_group' }
      group_new_information = { name: 'org_group_2', database_role: 'g_org_database_group_WRONG' }
      put api_v1_databases_group_update_url(database_name: @carto_organization.database_name, old_name: group_old_information[:name]), group_new_information, default_headers
      response.status.should == 500
    end

    it '#add_member from username' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      user_information = { username: @org_user_1.username }
      post api_v1_databases_group_add_member_url(database_name: group.database_name, name: group.name), user_information, default_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should include(@org_user_1.username)
    end

    it '#add_member returns 409 if username is already added' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      user_information = { username: @org_user_1.username }
      post api_v1_databases_group_add_member_url(database_name: group.database_name, name: group.name), user_information, default_headers
      response.status.should == 409
    end

    it '#update_permission granting read to a table' do
      bypass_named_maps
      @table_user_1 = create_table_with_options(@org_user_1)

      group = Carto::Group.where(organization_id: @carto_organization.id).first
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission, default_headers
      response.status.should == 200

      permission = ::Permission.where(entity_id: @table_user_1['table_visualization']['id']).first
      permission.should_not be_nil

      expected_acl = [
          {
              type: Permission::TYPE_GROUP,
              entity: {
                  id:         group.id,
                  name:       group.name
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      permission.to_poro[:acl].should == expected_acl
    end

    it '#update_permission granting write to a table' do
      bypass_named_maps
      @table_user_1 = create_table_with_options(@org_user_1)

      group = Carto::Group.where(organization_id: @carto_organization.id).first
      # First read, then write, to ensure there're no duplicates
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission, default_headers
      response.status.should == 200

      permission = { 'access' => 'w' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission, default_headers
      response.status.should == 200

      permission = ::Permission.where(entity_id: @table_user_1['table_visualization']['id']).first
      permission.should_not be_nil

      expected_acl = [
          {
              type: Permission::TYPE_GROUP,
              entity: {
                  id:         group.id,
                  name:       group.name
              },
              access: Permission::ACCESS_READWRITE
          }
      ]
      permission.to_poro[:acl].should == expected_acl
    end

    it '#destroy_permission to a table' do
      bypass_named_maps
      @table_user_1 = create_table_with_options(@org_user_1)

      group = Carto::Group.where(organization_id: @carto_organization.id).first
      permission = { 'access' => 'r' }
      put api_v1_databases_group_update_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), permission, default_headers
      response.status.should == 200

      expected_acl = [
          {
              type: Permission::TYPE_GROUP,
              entity: {
                  id:         group.id,
                  name:       group.name
              },
              access: Permission::ACCESS_NONE
          }
      ]

      delete api_v1_databases_group_destroy_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), '', default_headers
      response.status.should == 200
      permission = ::Permission.where(entity_id: @table_user_1['table_visualization']['id']).first
      permission.to_poro[:acl].should == expected_acl

      # Check it doesn't duplicate
      delete api_v1_databases_group_destroy_permission_url(database_name: group.database_name, name: group.name, username: @org_user_1.username, table_name: @table_user_1['name']), '', default_headers
      response.status.should == 404
    end

    # TODO: support for tables not yet registered?

    it '#remove_member from username' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      username = group.users.first.username
      delete api_v1_databases_group_remove_member_url(database_name: group.database_name, name: group.name, username: username), {}, default_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should_not include(username)
    end

    it '#remove_member from username throws 404 if member is not found' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      username = @org_user_1.username
      delete api_v1_databases_group_remove_member_url(database_name: group.database_name, name: group.name, username: username), {}, default_headers
      response.status.should == 404
    end

    it '#destroy an existing group' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      delete api_v1_databases_group_destroy_url(database_name: group.database_name, name: group.name), nil, default_headers
      response.status.should == 200
      Carto::Group.where(id: group.id).first.should be_nil
    end

    it '#destroy a nonexisting group returns 404' do
      delete api_v1_databases_group_destroy_url(database_name: @carto_organization.database_name, name: 'org_group'), nil, default_headers
      response.status.should == 404
    end

  end
end
