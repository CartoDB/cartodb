# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '.././../../factories/organizations_contexts'
require_relative '.././../../factories/visualization_creation_helpers'
require_relative '../../../../app/controllers/carto/api/grantables_controller'

describe Carto::Api::GrantablesController do
  include_context 'organization with users helper'

  def count_grantables(organization)
    organization.users.length + organization.groups.length
  end

  describe 'Grantables', :order => :defined do

    before(:all) do
      @headers = {'CONTENT_TYPE'  => 'application/json', :format => "json" }
    end

    it "Throws 401 error without http auth" do
      get api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id), {}, @headers
      response.status.should == 401
    end

    describe "#index", :order => :defined do

      it "returns all organization users as a grantable of type user with avatar_url" do
        get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), {}, @headers do |response|
          response.status.should == 200
          grantables = response.body[:grantables]
          grantables.length.should == @carto_organization.users.length
          grantables.map { |g| g['id'] }.should include(@org_user_1.id)
          grantables.map { |g| g['avatar_url'] }.should include(@org_user_1.avatar_url)
          response.body[:total_entries].should == @carto_organization.users.length
        end
      end

      it "returns all organization users and groups as a grantable of the right type, including additional information" do
        group_1 = FactoryGirl.create(:random_group, display_name: 'g_1', organization: @carto_organization)
        group_2 = FactoryGirl.create(:random_group, display_name: 'g_2', organization: @carto_organization)
        @carto_organization.reload

        get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), {}, @headers do |response|
          response.status.should == 200
          response.body[:grantables].length.should == count_grantables(@carto_organization)
          response.body[:total_entries].should == count_grantables(@carto_organization)

          response.body[:grantables].each { |g|
            g['id'].should == g['model']['id']
            case g['type']
            when 'user'
              g['name'].should == g['model']['username']
              user = Carto::User.find_by_username(g['model']['username'])
              g['model']['groups'].should == user.groups.map { |group| Carto::Api::GroupPresenter.new(group).to_poro }
            when 'group'
              g['name'].should == g['model']['display_name']
              users = g['model']['users']
              group = @carto_organization.groups.find_by_display_name(g['name'])
              users.should == group.users.map { |u| Carto::UserPresenter.new(u).to_poro }
            else
              raise "Unknown type #{g['type']}"
            end
          }
        end
      end

      it "can paginate results" do
        group_1 = @carto_organization.groups[0]
        group_2 = @carto_organization.groups[1]

        per_page = 1

        # this expectation is based on known naming:
        expected_ids = [group_1.id, group_2.id, @org_user_owner.id, @org_user_1.id, @org_user_2.id]

        expected_ids.each { |expected_id|
          page = expected_ids.index(expected_id) + 1

          get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), { page: page, per_page: per_page, order: 'name' }, @headers do |response|
            response.status.should == 200
            response.body[:grantables][0]['id'].should eq(expected_id), "#{response.body[:grantables][0]['id']} != #{expected_id}. Failing page: #{page}"
            response.body[:grantables].length.should == per_page
            response.body[:total_entries].should == count_grantables(@carto_organization)
          end
        }
      end

      it "can order by type" do
        expected_types = (1..@carto_organization.groups.count).map{'group'} + (1..@carto_organization.users.count).map{'user'}

        get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), { order: 'type' }, @headers do |response|
          response.status.should == 200
          response.body[:grantables].map { |g| g['type'] }.should == expected_types
        end
      end

      it 'can filter by name' do
        group = @carto_organization.groups.first

        get_json api_v1_grantables_index_url(user_domain: @org_user_owner.username, organization_id: @carto_organization.id, api_key: @org_user_owner.api_key), {q: group.display_name}, @headers do |response|
          response.status.should == 200
          response.body[:grantables].length.should == 1
          response.body[:total_entries].should == 1
          response.body[:grantables][0]['id'].should == group.id
        end
      end

      it 'filter by name with special characters uses them as literals' do
        search_strings = ['%', '___'] # % and _ are special characters in LIKE operator matchers

        search_strings.each do |q|
          get_json api_v1_grantables_index_url(
            user_domain: @org_user_owner.username,
            organization_id: @carto_organization.id,
            api_key: @org_user_owner.api_key
          ), { q: q }, @headers do |response|
            response.status.should == 200
            response.body[:grantables].length.should == 0
            response.body[:total_entries].should == 0
          end
        end
      end

      it "validates order param" do
        [:id, :name, :type, :avatar_url, :organization_id, :updated_at].each do |param|
          get_json api_v1_grantables_index_url(
            order: param,
            user_domain: @org_user_owner.username,
            organization_id: @carto_organization.id,
            api_key: @org_user_owner.api_key
          ), {}, @headers do |response|
            response.status.should == 200
          end
        end

        get_json api_v1_grantables_index_url(
          order: :invalid,
          user_domain: @org_user_owner.username,
          organization_id: @carto_organization.id,
          api_key: @org_user_owner.api_key
        ), {}, @headers do |response|
          response.status.should == 400
          response.body.fetch(:errors).should_not be_nil
        end
      end
    end

  end
end
