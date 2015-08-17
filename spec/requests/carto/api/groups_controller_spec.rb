# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '.././../../factories/organizations_contexts'
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

    it '#add_member from username' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      user_information = { username: @org_user_1.username }
      post api_v1_databases_group_add_member_url(database_name: group.database_name, name: group.name), user_information, default_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should include(@org_user_1.username)
    end

    it '#remove_member from username' do
      group = Carto::Group.where(organization_id: @carto_organization.id).first
      username = group.users.first.username
      delete api_v1_databases_group_remove_member_url(database_name: group.database_name, name: group.name, username: username), {}, default_headers
      response.status.should == 200
      group.reload
      group.users.collect(&:username).should_not include(username)
    end

    it '#destroy an existing group' do
      group = FactoryGirl.create(:carto_group, organization: @carto_organization)
      Carto::Group.where(id: group.id).first.should_not be_nil
      delete api_v1_databases_group_destroy_url(database_name: group.database_name, name: group.name), nil, default_headers
      response.status.should == 200
      Carto::Group.where(id: group.id).first.should be_nil
    end

  end
end
