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

    it '#destroy an existing group' do
      group = FactoryGirl.create(:carto_group, organization: @carto_organization)
      Carto::Group.where(id: group.id).first.should_not be_nil
      delete api_v1_databases_group_destroy_url(database_name: group.database_name, database_role: group.database_role), nil, default_headers
      response.status.should == 200
      Carto::Group.where(id: group.id).first.should be_nil
    end

  end
end
