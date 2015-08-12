# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '.././../../factories/organizations_contexts'
require_relative '../../../../app/controllers/carto/api/groups_controller'

describe Carto::Api::GroupsController do
  include_context 'organization with users helper'

  describe '#create' do

    before(:all) do
      @no_auth_headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
    end

    before(:each) do
      @carto_organization = Carto::Organization.find(@organization.id)
    end

    it "Throws 401 error without http auth" do
      post api_v1_organization_group_create_url(org_id: @carto_organization.id), {}.to_json, @no_auth_headers
      response.status.should == 401
    end

    it 'creates a new group' do
      group_information = { database_name: @carto_organization.database_name, name: 'g_org_database_group' }
      post api_v1_organization_group_create_url(org_id: @carto_organization.id), group_information, default_headers
      response.status.should == 200
      group = Carto::Group.where(organization_id: @carto_organization.id, name: group_information[:name]).first
      group.should_not be_nil
      group.name.should == group_information[:name]
      group.database_name.should == group_information[:database_name]
    end

  end
end
