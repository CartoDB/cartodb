require 'spec_helper'

# cURL samples:
# - Rename group: curl -v -H "Content-Type: application/json" -X PUT -d '{ "display_name": "Demo Group" }' "http://central-org-b-admin.localhost.lan:3000/api/v1/organization/95c2c425-5c8c-4b20-8999-d79cd20c2f2c/groups/c662f7ee-aefb-4f49-93ea-1f671a77bb36?api_key=665646f527c3006b124c15a308bb98f4ed1f52e4"
# - Add users: curl -v -H "Content-Type: application/json" -X POST -d '{ "users" : ["78ee570a-812d-4cce-928c-e5ebeb4708e8", "7e53c96c-1598-43e0-b23e-290daf633547"] }' "http://central-org-b-admin.localhost.lan:3000/api/v1/organization/95c2c425-5c8c-4b20-8999-d79cd20c2f2c/groups/c662f7ee-aefb-4f49-93ea-1f671a77bb36/users?api_key=665646f527c3006b124c15a308bb98f4ed1f52e4"
# - Remove users: curl -v -H "Content-Type: application/json" -X DELETE -d '{ "users" : ["78ee570a-812d-4cce-928c-e5ebeb4708e8", "7e53c96c-1598-43e0-b23e-290daf633547"] }' "http://central-org-b-admin.localhost.lan:3000/api/v1/organization/95c2c425-5c8c-4b20-8999-d79cd20c2f2c/groups/c662f7ee-aefb-4f49-93ea-1f671a77bb36/users?api_key=665646f527c3006b124c15a308bb98f4ed1f52e4"

describe Carto::Api::GroupsController do
  include_context 'organization with users helper'

  shared_examples_for 'Groups editor management' do
    before(:all) do
      @org_user_1_json = {
        "id" => @org_user_1.id,
        "name" => @org_user_1.name,
        "last_name" => @org_user_1.last_name,
        "username" => @org_user_1.username,
        "avatar_url" => @org_user_1.avatar_url,
        "base_url" => @org_user_1.public_url,
        "disqus_shortname" => @org_user_1.disqus_shortname,
        "viewer" => @org_user_1.viewer,
        "org_admin" => false,
        "org_user" => true,
        "remove_logo" => @org_user_1.remove_logo?,
        "google_maps_query_string" => @org_user_1.google_maps_query_string
      }

      @group_1 = create(:random_group, display_name: 'g_1', organization: @carto_organization)
      @group_1_json = { 'id' => @group_1.id, 'organization_id' => @group_1.organization_id, 'name' => @group_1.name, 'display_name' => @group_1.display_name }
      @group_2 = create(:random_group, display_name: 'g_2', organization: @carto_organization)
      @group_2_json = { 'id' => @group_2.id, 'organization_id' => @group_2.organization_id, 'name' => @group_2.name, 'display_name' => @group_2.display_name }
      @group_3 = create(:random_group, display_name: 'g_3', organization: @carto_organization)
      @group_3_json = { 'id' => @group_3.id, 'organization_id' => @group_3.organization_id, 'name' => @group_3.name, 'display_name' => @group_3.display_name }
      @headers = { 'CONTENT_TYPE' => 'application/json', :format => "json", 'Accept' => 'application/json' }
    end

    after(:all) do
      @group_1.destroy
      @group_2.destroy
      @group_3.destroy
    end

    before(:each) do
      @carto_organization.reload
    end

    describe '#index' do

      it 'returns 401 without authentication' do
        get_json api_v1_organization_groups_url(user_domain: @admin_user.username, organization_id: @carto_organization.id), {}, @headers do |response|
          response.status.should == 401
        end
      end

      it 'returns groups with pagination metadata' do
        get_json api_v1_organization_groups_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, api_key: @admin_user.api_key), {}, @headers do |response|
          response.status.should == 200
          expected_response = {
            groups: [ @group_1_json, @group_2_json, @group_3_json ],
            total_entries: 3
          }
          response.body.should == expected_response.deep_symbolize_keys
        end
      end

      it 'returns paginated groups with pagination metadata' do
        get_json api_v1_organization_groups_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, api_key: @admin_user.api_key), { page: 2, per_page: 1, order: 'display_name' }, @headers do |response|
          response.status.should == 200
          expected_response = {
            groups: [ @group_2_json ],
            total_entries: 3
          }
          response.body.should == expected_response.deep_symbolize_keys
        end
      end

      it 'can search by name' do
        get_json api_v1_organization_groups_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, api_key: @admin_user.api_key, q: @group_2.name), { page: 1, per_page: 1, order: 'display_name' }, @headers do |response|
          response.status.should == 200
          expected_response = {
            groups: [ @group_2_json ],
            total_entries: 1
          }
          response.body.should == expected_response.deep_symbolize_keys
        end
      end

      it 'validates order param' do
        [:id, :name, :display_name, :organization_id, :updated_at].each do |param|
          get_json api_v1_organization_groups_url(
            order: param,
            user_domain: @admin_user.username,
            organization_id: @carto_organization.id,
            api_key: @admin_user.api_key
          ), {}, @headers do |response|
            response.status.should == 200
          end
        end

        get_json api_v1_organization_groups_url(
          order: :invalid,
          user_domain: @admin_user.username,
          organization_id: @carto_organization.id,
          api_key: @admin_user.api_key
        ), {}, @headers do |response|
          response.status.should == 400
          response.body.fetch(:errors).should_not be_nil
        end
      end

      describe "users groups" do

        before(:each) do
          @group_1.add_user(@org_user_1.username)
        end

        after(:each) do
          @group_1.remove_user(@org_user_1.username)
        end

        it 'returns user groups if user_id is requested' do
          get_json api_v1_user_groups_url(user_domain: @org_user_1.username, user_id: @org_user_1.id, api_key: @org_user_1.api_key), {}, @headers do |response|
            response.status.should == 200
            expected_response = {
              groups: [ @group_1_json ],
              total_entries: 1
            }
            response.body.should == expected_response.deep_symbolize_keys
          end
        end

        it 'optionally fetches number of shared tables, maps and users' do
          get_json api_v1_user_groups_url(user_domain: @org_user_1.username, user_id: @org_user_1.id, api_key: @org_user_1.api_key), {}, @headers do |response|
            response.status.should == 200
            expected_response = {
              groups: [
                @group_1_json
              ],
              total_entries: 1
            }
            response.body.should == expected_response.deep_symbolize_keys
          end

          get_json api_v1_user_groups_url(user_domain: @org_user_1.username, user_id: @org_user_1.id, api_key: @org_user_1.api_key, fetch_shared_tables_count: true, fetch_shared_maps_count: true, fetch_users: true), {}, @headers do |response|
            response.status.should == 200
            expected_response = {
              groups: [
                @group_1_json.merge({
                  'shared_tables_count' => 0,
                  'shared_maps_count' => 0,
                  'users' => [ @org_user_1_json ]
                })
              ],
              total_entries: 1
            }
            response.body.should == expected_response.deep_symbolize_keys
          end
        end

        it 'can fetch number of shared tables, maps and users when a table is shared' do
          bypass_named_maps
          table_user_2 = create_table_with_options(@org_user_2)
          visualization = Carto::Visualization.find(table_user_2['table_visualization'][:id])
          permission = Carto::Permission.find(visualization.permission.id)
          permission.set_group_permission(@group_1, Carto::Permission::ACCESS_READONLY)
          permission.save

          get_json api_v1_user_groups_url(user_domain: @org_user_1.username, user_id: @org_user_1.id, api_key: @org_user_1.api_key, fetch_shared_tables_count: true, fetch_shared_maps_count: true, fetch_users: true), {}, @headers do |response|
            response.status.should == 200
            expected_response = {
              groups: [
               @group_1_json.merge({
                  'shared_tables_count' => 1,
                  'shared_maps_count' => 0,
                  'users' => [ @org_user_1_json ]
                })
              ],
              total_entries: 1
            }
            response.body.should == expected_response.deep_symbolize_keys
          end
        end

      end

    end

    it '#show returns a group' do
      get_json api_v1_organization_groups_show_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, group_id: @group_1.id, api_key: @admin_user.api_key), { }, @headers do |response|
        response.status.should == 200
        response.body.should == @group_1_json.symbolize_keys
      end
    end

    it '#show support fetch_shared_maps_count, fetch_shared_tables_count and fetch_users' do
      get_json api_v1_organization_groups_show_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, group_id: @group_1.id, api_key: @admin_user.api_key, fetch_shared_tables_count: true, fetch_shared_maps_count: true, fetch_users: true), { }, @headers do |response|
        response.status.should == 200
        response.body[:shared_tables_count].should_not be_nil
        response.body[:shared_maps_count].should_not be_nil
        response.body[:users].should_not be_nil
      end
    end

    it '#create fails if user is not owner' do
      post_json api_v1_organization_groups_create_url(user_domain: @org_user_1.username, organization_id: @carto_organization.id, api_key: @org_user_1.api_key), { display_name: 'willfail' }, @headers do |response|
        response.status.should == 400
      end
    end

    it '#create triggers group creation' do
      display_name = 'a new group'
      name = 'a new group'

      # Replacement for extension interaction
      fake_database_role = 'fake_database_role'
      fake_group_creation = Carto::Group.new_instance(@carto_organization.database_name, name, fake_database_role)
      fake_group_creation.save
      Carto::Group.expects(:create_group_extension_query).with(anything, name).returns(fake_group_creation)

      post_json api_v1_organization_groups_create_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, api_key: @admin_user.api_key), { display_name: display_name }, @headers do |response|
        response.status.should == 200
        response.body[:id].should_not be_nil
        response.body[:organization_id].should == @carto_organization.id
        response.body[:name].should == name
        response.body[:display_name].should == display_name

        # Also check database data because Group changes something after extension interaction
        new_group = Carto::Group.find(response.body[:id])
        new_group.organization_id.should == @carto_organization.id
        new_group.name.should == name
        new_group.display_name.should == display_name
        new_group.database_role.should_not be_nil
      end
    end

    it '#update triggers group renaming' do
      group = @carto_organization.groups.first
      new_display_name = 'A Group %Renamed'
      expected_new_name = 'A Group _Renamed'

      Carto::Group.expects(:rename_group_extension_query).with(anything, group.name, expected_new_name)

      put_json api_v1_organization_groups_update_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, group_id: group.id, api_key: @admin_user.api_key), { display_name: new_display_name }, @headers do |response|
        response.status.should == 200
        response.body[:id].should_not be_nil
        response.body[:organization_id].should == @carto_organization.id
        # INFO: since test doesn't actually trigger the extension we only check expectation on renaming call and display name
        response.body[:display_name].should == new_display_name
        response.body[:shared_tables_count].should_not be_nil
        response.body[:shared_maps_count].should_not be_nil
        response.body[:users].should_not be_nil

        # Also check database data because Group changes something after extension interaction
        new_group = Carto::Group.find(response.body[:id])
        new_group.organization_id.should == @carto_organization.id
        new_group.display_name.should == new_display_name
        new_group.database_role.should_not be_nil
      end
    end

    it '#update returns 409 and a meaningful error message if there is a group with the same name within the organization' do
      group = @carto_organization.groups[0]
      group_2 = @carto_organization.groups[1]

      Carto::Group.expects(:rename_group_extension_query).with(anything, anything, anything).never

      put_json api_v1_organization_groups_update_url(user_domain: @admin_user.username, organization_id: @carto_organization.id, group_id: group.id, api_key: @admin_user.api_key), { display_name: group_2.display_name }, @headers do |response|
        response.status.should == 409
        response.body[:errors][0].should match /A group with that name already exists/
      end
    end

    it '#add_users triggers group inclusion' do
      group = @carto_organization.groups.first
      user = @org_user_1

      Carto::Group.expects(:add_users_group_extension_query).with(anything, group.name, [user.username])

      post_json api_v1_organization_groups_add_users_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key
      ), {
        user_id: user.id,
        password_confirmation:  '00012345678'
      }, @headers do |response|
        response.status.should == 200
        # INFO: since test doesn't actually trigger the extension we only check expectation on membership call
      end
    end

    it 'fails to #add_users if wrong password_confirmation' do
      group = @carto_organization.groups.first
      user = @org_user_1

      post_json api_v1_organization_groups_add_users_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key
      ), {
        user_id: user.id,
        password_confirmation:  'wrong'
      }, @headers do |response|
        response.status.should == 403
        response.body[:errors].should include "Confirmation password sent does not match your current password"
      end
    end

    it '#remove_users triggers group exclusion' do
      group = @carto_organization.groups.first
      user = @carto_org_user_1
      group.users << user
      group.save
      group.reload
      group.users.include?(user)

      Carto::Group.expects(:remove_users_group_extension_query).with(anything, group.name, [user.username])

      delete_json api_v1_organization_groups_remove_users_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key,
        user_id: user.id
      ), {
        password_confirmation: '00012345678'
      }, @headers do |response|
        response.status.should == 200
        # INFO: since test doesn't actually trigger the extension we only check expectation on membership call
      end
    end

    it 'fails #remove_users if wrong password_confirmation' do
      group = @carto_organization.groups.first
      user = @carto_org_user_1
      group.users << user unless group.users.include?(user)
      group.save
      group.reload
      group.users.include?(user)

      delete_json api_v1_organization_groups_remove_users_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key,
        user_id: user.id
      ), {
        password_confirmation: 'wrong'
      }, @headers do |response|
        response.status.should == 403
        response.body[:errors].should include "Confirmation password sent does not match your current password"
      end
    end

    it '#add_users allows batches and triggers group inclusion' do
      group = @carto_organization.groups.first
      user_1 = @org_user_1
      user_2 = @org_user_2

      Carto::Group.expects(:add_users_group_extension_query)
                  .with(anything, group.name, [user_1.username, user_2.username])

      post_json api_v1_organization_groups_add_users_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key
      ), {
        users: [user_1.id, user_2.id],
        password_confirmation: '00012345678'
      }, @headers do |response|
        response.status.should == 200
        # INFO: since test doesn't actually trigger the extension we only check expectation on membership call
      end
    end

    it '#remove_users allows batches and triggers group exclusion' do
      group = @carto_organization.groups.first
      user_1 = @carto_org_user_1
      user_2 = @carto_org_user_2
      group.users << user_2
      group.save
      group.reload
      group.users.include?(user_1)
      group.users.include?(user_2)

      Carto::Group.expects(:remove_users_group_extension_query)
                  .with(anything, group.name, [user_1.username, user_2.username])

      delete_json api_v1_organization_groups_remove_users_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key
      ), {
        users: [user_1.id, user_2.id],
        password_confirmation: '00012345678'
      }, @headers do |response|
        response.status.should == 200
        # INFO: since test doesn't actually trigger the extension we only check expectation on membership call
      end
    end

    it '#drops triggers deletion of existing groups' do
      group = @carto_organization.groups.first

      Carto::Group.expects(:destroy_group_extension_query).with(anything, group.name)

      delete_json api_v1_organization_groups_destroy_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key
      ), {
        password_confirmation: '00012345678'
      }, @headers do |response|
        response.status.should == 204

        # Extension is simulated, so we delete the group manually
        group.delete
      end
    end

    it 'cannot destroy group if wrong password_confirmation' do
      group = @carto_organization.groups.first

      delete_json api_v1_organization_groups_destroy_url(
        user_domain: @admin_user.username,
        organization_id: @carto_organization.id,
        group_id: group.id,
        api_key: @admin_user.api_key
      ), {
        password_confirmation: 'wrong'
      }, @headers do |response|
        response.status.should == 403
        response.body[:errors].should include "Confirmation password sent does not match your current password"
      end
    end
  end

  describe 'with organization owner' do
    it_behaves_like 'Groups editor management' do
      before(:all) do
        @admin_user = @organization.owner
        @admin_user.password = '00012345678'
        @admin_user.password_confirmation = '00012345678'
        @admin_user.save
      end
    end
  end

  describe 'with organization admin' do
    it_behaves_like 'Groups editor management' do
      before(:all) do
        @org_user_2.org_admin = true
        @org_user_2.save
        @admin_user = @org_user_2
        @admin_user.password = '00012345678'
        @admin_user.password_confirmation = '00012345678'
        @admin_user.save
      end
    end
  end
end
