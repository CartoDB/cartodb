# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '.././../../factories/organizations_contexts'
require_relative '.././../../factories/visualization_creation_helpers'
require_relative '../../../../app/controllers/carto/api/grantables_controller'

describe Carto::Api::GrantablesController do
  include_context 'organization with users helper'

  describe 'Grantables', :order => :defined do

    before(:all) do
      @headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
    end

    before(:each) do
      @carto_organization = Carto::Organization.find(@organization.id)
    end

    it "Throws 401 error without http auth" do
      get api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id), {}, @headers
      response.status.should == 401
    end

    describe "#index", :order => :defined do

      it "returns all organization users as a grantable of type user" do
        get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), {}, @headers do |response|
          response.status.should == 200
          response.body[:grantables].length.should == @carto_organization.users.length
          response.body[:total_entries].should == @carto_organization.grantables.length
          response.body[:total_org_entries].should == @carto_organization.grantables.length
        end
      end

      it "returns all organization users and groups as a grantable of type user" do
        group_1 = FactoryGirl.create(:random_group, display_name: 'g_1', organization: @carto_organization)
        group_2 = FactoryGirl.create(:random_group, display_name: 'g_2', organization: @carto_organization)
        @carto_organization.reload

        get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), {}, @headers do |response|
          response.status.should == 200
          response.body[:grantables].length.should == @carto_organization.users.length + @carto_organization.groups.length
          response.body[:total_entries].should == @carto_organization.grantables.length
          response.body[:total_org_entries].should == @carto_organization.grantables.length
        end
      end

    end

  end
end
