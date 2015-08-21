# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/database_groups_controller'

describe Carto::Api::GroupsController do
  include_context 'organization with users helper'

  describe 'Groups editor management' do

    before(:all) do
      @carto_organization = Carto::Organization.find(@organization.id)
      @group_1 = FactoryGirl.create(:random_group, display_name: 'g_1', organization: @carto_organization)
      @group_1_json = { 'id' => @group_1.id, 'organization_id' => @group_1.organization_id, 'name' => @group_1.name, 'display_name' => @group_1.display_name }
      @group_2 = FactoryGirl.create(:random_group, display_name: 'g_2', organization: @carto_organization)
      @group_2_json = { 'id' => @group_2.id, 'organization_id' => @group_2.organization_id, 'name' => @group_2.name, 'display_name' => @group_2.display_name }
      @group_3 = FactoryGirl.create(:random_group, display_name: 'g_3', organization: @carto_organization)
      @group_3_json = { 'id' => @group_3.id, 'organization_id' => @group_3.organization_id, 'name' => @group_3.name, 'display_name' => @group_3.display_name }
      @no_auth_headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
    end

    after(:all) do
      @group_1.destroy
      @group_2.destroy
      @group_3.destroy
    end

    it '#index returns 401 without authentication' do
      get_json api_v1_organization_groups_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id), {}, @no_auth_headers do |response|
        response.status.should == 401
      end
    end

    it '#index returns groups with pagination metadata' do
      get_json api_v1_organization_groups_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), {}, @no_auth_headers do |response|
        response.status.should == 200
        expected_response = {
          groups: [ @group_1_json, @group_2_json, @group_3_json ],
          total_entries: 3,
          total_org_entries: 3
        }
        response.body.should == expected_response
      end
    end

    it '#index returns paginated groups with pagination metadata' do
      get_json api_v1_organization_groups_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), { page: 2, per_page: 1, order: 'display_name' }, @no_auth_headers do |response|
        response.status.should == 200
        expected_response = {
          groups: [ @group_2_json ],
          total_entries: 3,
          total_org_entries: 3
        }
        response.body.should == expected_response
      end
    end

  end

end
