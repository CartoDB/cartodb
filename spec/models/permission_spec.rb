# coding: UTF-8

require_relative '../spec_helper'

include CartoDB

describe CartoDB::Permission do

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    ::User.any_instance.stubs(:gravatar).returns(nil)
    @user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
  end

  after(:each) do
    Permission.all.each { |perm| perm.destroy }
    SharedEntity.all.each { |entity| entity.destroy }
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
  end

  describe '#create' do
    it 'tests basic creation' do
      entity_id = UUIDTools::UUID.timestamp_create.to_s
      entity_type = Permission::ENTITY_TYPE_VISUALIZATION

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      vis_table_mock = mock
      vis_table_mock.stubs(:add_read_permission)
      vis_entity_mock = mock
      vis_perm_mock = mock
      vis_perm_mock.stubs(:owner_id).returns(@user.id)
      vis_perm_mock.stubs(:save)

      vis_entity_mock.stubs(:permission).returns(vis_perm_mock)
      vis_entity_mock.stubs(:table?).returns(true)
      vis_entity_mock.stubs(:invalidate_cache).returns(nil)
      vis_entity_mock.stubs(:table).returns(vis_table_mock)
      vis_entity_mock.stubs(:related_tables).returns([])
      vis_entity_mock.stubs(:privacy=)
      vis_entity_mock.stubs(:store)
      vis_entity_mock.stubs(:type).returns(CartoDB::Visualization::Member::TYPE_DERIVED)
      vis_entity_mock.stubs(:id).returns(entity_id)
      vis_entity_mock.stubs(:name).returns("foobar_visualization")
      Permission.any_instance.stubs(:entity).returns(vis_entity_mock)

      acl_initial = []
      acl_with_data = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: UUIDTools::UUID.timestamp_create.to_s,
            username: 'another_username',
            avatar_url: 'whatever'
          },
          access: Permission::ACCESS_READONLY
        }
      ]
      acl_with_data_expected = [
        {
          type: acl_with_data[0][:type],
          id:   acl_with_data[0][:entity][:id],
          access: acl_with_data[0][:access]
        }
      ]

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username,
        entity_id:      entity_id,
        entity_type:    entity_type
        #check default acl is correct
      )
      permission.save

      permission.id.should_not eq nil
      permission.owner_id.should eq @user.id
      permission.owner_username.should eq @user.username
      permission.entity_id.should eq entity_id
      permission.entity_type.should eq entity_type
      permission.acl.should eq acl_initial

      permission.acl = acl_with_data
      permission.save
      #vis_table_mock.expects(:add_read_permission)
      #expect(vis_table_mock).to receive(:add_read_permission)

      permission.acl.should eq acl_with_data_expected

      # Nil should reset to default value
      permission.acl = nil
      permission.acl.should eq acl_initial

      permission.destroy

      # Missing owner
      permission2 = Permission.new
      expect {
        permission2.save
      }.to raise_exception

      # Owner helper methods
      permission2 = Permission.new
      permission2.owner = @user
      permission2.entity_id = entity_id
      permission2.entity_type = entity_type
      permission2.save
      permission2.owner.should eq @user
      permission2.owner_id.should eq @user.id
      permission2.owner_username.should eq @user.username
      permission2.delete

      # Entity helper methods
      vis_mock = mock
      vis_mock.stubs(:fetch).returns(vis_mock)
      vis_mock.stubs(:id).returns(entity_id)
      vis_mock.stubs(:kind_of?).returns(true)
      vis_mock.stubs(:type).returns(CartoDB::Visualization::Member::TYPE_DERIVED)
      Visualization::Member.any_instance.stubs(:new).returns vis_mock
      permission2 = Permission.new
      permission2.owner = @user
      permission2.save

      # invalid ACL formats
      expect {
        permission2.acl = 'not an array!'
      }.to raise_exception CartoDB::PermissionError

      expect {
        permission2.acl = [
            'aaa'
        ]
      }.to raise_exception CartoDB::PermissionError

      expect {
        permission2.acl = [
          {}
        ]
      }.to raise_exception CartoDB::PermissionError

      expect {
        permission2.acl = [
          {
            # missing fields
            wadus: 'aaa'
          }
        ]
      }.to raise_exception CartoDB::PermissionError

      user2 = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
      permission2.acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Permission::ACCESS_READONLY,
          # Extra undesired field
          wadus: 'aaa'
        }
      ]

      # Wrong permission access
      expect {
        permission2.acl = [
          {
            type: Permission::TYPE_USER,
            entity: {
              id: user2.id,
              username: user2.username
            },
            access: '123'
          }
        ]
      }.to raise_exception CartoDB::PermissionError

      permission2.destroy
      user2.destroy
    end

    it 'supports groups' do
      entity_id = UUIDTools::UUID.timestamp_create.to_s
      entity_type = Permission::ENTITY_TYPE_VISUALIZATION

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      Carto::Group.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      vis_table_mock = mock
      vis_table_mock.stubs(:add_read_permission)
      vis_entity_mock = mock
      vis_perm_mock = mock
      vis_perm_mock.stubs(:owner_id).returns(@user.id)
      vis_perm_mock.stubs(:save)

      vis_entity_mock.stubs(:permission).returns(vis_perm_mock)
      vis_entity_mock.stubs(:table?).returns(true)
      vis_entity_mock.stubs(:invalidate_cache).returns(nil)
      vis_entity_mock.stubs(:table).returns(vis_table_mock)
      vis_entity_mock.stubs(:related_tables).returns([])
      vis_entity_mock.stubs(:privacy=)
      vis_entity_mock.stubs(:store)
      vis_entity_mock.stubs(:type).returns(CartoDB::Visualization::Member::TYPE_DERIVED)
      vis_entity_mock.stubs(:id).returns(entity_id)
      vis_entity_mock.stubs(:name).returns("foobar_visualization")
      Permission.any_instance.stubs(:entity).returns(vis_entity_mock)

      organization = Carto::Organization.find(FactoryGirl.create(:organization).id)
      group = FactoryGirl.create(:random_group, organization: organization)

      acl_initial = []
      acl_with_data = [
        {
          type: Permission::TYPE_GROUP,
          entity: {
            id: group.id,
            username: 'a_group'
          },
          access: Permission::ACCESS_READONLY
        }
      ]
      acl_with_data_expected = [
        {
          type: acl_with_data[0][:type],
          id:   acl_with_data[0][:entity][:id],
          access: acl_with_data[0][:access]
        }
      ]

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username,
        entity_id:      entity_id,
        entity_type:    entity_type
        #check default acl is correct
      )
      permission.save

      permission.id.should_not eq nil
      permission.owner_id.should eq @user.id
      permission.owner_username.should eq @user.username
      permission.entity_id.should eq entity_id
      permission.entity_type.should eq entity_type
      permission.acl.should eq acl_initial

      permission.acl = acl_with_data
      permission.save
      #vis_table_mock.expects(:add_read_permission)
      #expect(vis_table_mock).to receive(:add_read_permission)

      permission.acl.should eq acl_with_data_expected

      # Nil should reset to default value
      permission.acl = nil
      permission.acl.should eq acl_initial

      permission.destroy
    end
  end

  describe '#permissions_methods' do
    it 'checks permission_for_user and is_owner methods' do
      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(nil)
      user3_mock = mock
      user3_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user3_mock.stubs(:username).returns('user3')
      user3_mock.stubs(:organization).returns(nil)

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      prepare_vis_mock_in_permission

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username,
        entity_id: UUIDTools::UUID.timestamp_create.to_s,
        entity_type: Permission::ENTITY_TYPE_VISUALIZATION
      )
      permission.acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2_mock.id,
            username: user2_mock.username
          },
          access: Permission::ACCESS_READONLY
        }
      ]

      permission.save
      # Here try full reload of model
      permission = Permission.where(id: permission.id).first

      permission.should_not eq nil

      permission.is_owner?(@user).should eq true
      permission.is_owner?(user2_mock).should eq false
      permission.is_owner?(user3_mock).should eq false

      permission.permission_for_user(@user).should eq Permission::ACCESS_READWRITE
      permission.permission_for_user(user2_mock).should eq Permission::ACCESS_READONLY
      permission.permission_for_user(user3_mock).should eq Permission::ACCESS_NONE
    end

    it 'checks is_permitted' do
      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(nil)
      user3_mock = mock
      user3_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user3_mock.stubs(:username).returns('user3')
      user3_mock.stubs(:organization).returns(nil)
      user4_mock = mock
      user4_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user4_mock.stubs(:username).returns('user4')
      user4_mock.stubs(:organization).returns(nil)

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      prepare_vis_mock_in_permission

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username,
        entity_id: UUIDTools::UUID.timestamp_create.to_s,
        entity_type: Permission::ENTITY_TYPE_VISUALIZATION
      )
      permission.acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2_mock.id,
            username: user2_mock.username
          },
          access: Permission::ACCESS_READONLY
        },
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user3_mock.id,
            username: user3_mock.username
          },
          access: Permission::ACCESS_READWRITE
        }
      ]
      permission.save

      permission.is_permitted?(user2_mock, Permission::ACCESS_READONLY).should eq true
      permission.is_permitted?(user2_mock, Permission::ACCESS_READWRITE).should eq false

      permission.is_permitted?(user3_mock, Permission::ACCESS_READONLY).should eq true
      permission.is_permitted?(user3_mock, Permission::ACCESS_READWRITE).should eq true

      permission.is_permitted?(user4_mock, Permission::ACCESS_READONLY).should eq false
      permission.is_permitted?(user4_mock, Permission::ACCESS_READWRITE).should eq false
    end

    it 'checks organizations vs users permissions precedence' do
      org_mock = mock
      org_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      org_mock.stubs(:name).returns('some_org')
      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(org_mock)

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      prepare_vis_mock_in_permission

      permission = Permission.new(
          owner_id:       @user.id,
          owner_username: @user.username,
          entity_id: UUIDTools::UUID.timestamp_create.to_s,
          entity_type: Permission::ENTITY_TYPE_VISUALIZATION
      )
      # User has more access than org
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: user2_mock.id,
                  username: user2_mock.username
              },
              access: Permission::ACCESS_READWRITE
          },
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id: org_mock.id,
                  username: org_mock.name
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      permission.save
      permission.is_permitted?(user2_mock, Permission::ACCESS_READONLY).should eq true
      permission.is_permitted?(user2_mock, Permission::ACCESS_READWRITE).should eq true

      # Organization has more permissions than user. Should get overriden (user prevails)
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: user2_mock.id,
                  username: user2_mock.username
              },
              access: Permission::ACCESS_READONLY
          },
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id: org_mock.id,
                  username: org_mock.name
              },
              access: Permission::ACCESS_READWRITE
          }
      ]
      permission.save
      permission.is_permitted?(user2_mock, Permission::ACCESS_READONLY).should eq true
      permission.is_permitted?(user2_mock, Permission::ACCESS_READWRITE).should eq false

      # User has revoked permissions, org has permissions. User revoked should prevail
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: user2_mock.id,
                  username: user2_mock.username
              },
              access: Permission::ACCESS_NONE
          },
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id: org_mock.id,
                  username: org_mock.name
              },
              access: Permission::ACCESS_READWRITE
          }
      ]
      permission.save
      permission.is_permitted?(user2_mock, Permission::ACCESS_READONLY).should eq false
      permission.is_permitted?(user2_mock, Permission::ACCESS_READWRITE).should eq false

      # Organization permission only
      permission.acl = [
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id: org_mock.id,
                  username: org_mock.name
              },
              access: Permission::ACCESS_READWRITE
          }
      ]
      permission.save

      permission.is_permitted?(user2_mock, Permission::ACCESS_READONLY).should eq true
      permission.is_permitted?(user2_mock, Permission::ACCESS_READWRITE).should eq true
    end

  end

  describe '#shared_entities' do
    it 'tests the management of shared entities upon permission save (based on its ACL)' do
      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(nil)

      entity_id = UUIDTools::UUID.timestamp_create.to_s

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      prepare_vis_mock_in_permission(entity_id)

      permission = Permission.new(
          owner_id:       @user.id,
          owner_username: @user.username,
          entity_id:      entity_id,
          entity_type:    Permission::ENTITY_TYPE_VISUALIZATION
      ).save

      # Create old entries
      CartoDB::SharedEntity.new(
          recipient_id:   @user.id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id:      entity_id,
          entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      ).save
      CartoDB::SharedEntity.new(
          recipient_id:   user2_mock.id,
          recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
          entity_id:      entity_id,
          entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      ).save

      CartoDB::SharedEntity.all.count.should eq 2

      # Leave only user 1
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: @user.id,
                  username: @user.username
              },
              access: Permission::ACCESS_READONLY
          }
          # shared entry of user 2 should dissapear
      ]
      permission.save

      CartoDB::SharedEntity.all.count.should eq 1
      shared_entity = CartoDB::SharedEntity.all[0]
      shared_entity.recipient_id.should eq @user.id
      shared_entity.entity_id.should eq entity_id

      # Leave only user 2 now
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: user2_mock.id,
                  username: user2_mock.username
              },
              access: Permission::ACCESS_READWRITE
          }
      ]
      permission.save

      CartoDB::SharedEntity.all.count.should eq 1
      shared_entity = CartoDB::SharedEntity.all[0]
      shared_entity.recipient_id.should eq user2_mock.id
      shared_entity.entity_id.should eq entity_id

      # Now just change permission, user2 should still be there
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: user2_mock.id,
                  username: user2_mock.username
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      permission.save

      CartoDB::SharedEntity.all.count.should eq 1
      shared_entity = CartoDB::SharedEntity.all[0]
      shared_entity.recipient_id.should eq user2_mock.id
      shared_entity.entity_id.should eq entity_id

      # Now set a permission forbidding a user, so should dissapear too
      permission.acl = [
          {
              type: Permission::TYPE_USER,
              entity: {
                  id: user2_mock.id,
                  username: user2_mock.username
              },
              access: Permission::ACCESS_NONE
          }
      ]
      permission.save

      CartoDB::SharedEntity.all.count.should eq 0

      permission.destroy
    end
  end

  describe "permissions diffs" do
    it "should enqueue the right notification email" do
      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      prepare_vis_mock_in_permission

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username,
        entity_type: Permission::ENTITY_TYPE_VISUALIZATION
      )
      permission.entity_id = permission.entity.id

      permission.save

      user2_id = "17d5b1e6-0d14-11e4-a3ef-0800274a1928"
      user3_id = "28d09bc0-0d14-11e4-a3ef-0800274a1928"
      permissions_changes = {
        "user" => {
          user2_id => [{ "action"=>"grant", "type"=>"r" }],
          user3_id => [{ "action"=>"revoke", "type"=>"r" }]
          }
        }

      ::Resque.stubs(:enqueue).returns(nil)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::ShareVisualization, permission.entity.id, user2_id).once
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::UnshareVisualization, permission.entity.name, permission.owner_username, user3_id).once

      permission.notify_permissions_change(permissions_changes)
      permission.destroy
    end

    it "should call the permissions comparisson function with correct values" do
      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(nil)
      user3_mock = mock
      user3_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user3_mock.stubs(:username).returns('user3')
      user3_mock.stubs(:organization).returns(nil)

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)
      # No need to check for real DB visualizations
      prepare_vis_mock_in_permission

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username,
        entity_type: Permission::ENTITY_TYPE_VISUALIZATION
      )
      permission.entity_id = permission.entity.id

      Resque.stubs(:enqueue).returns(nil)

      permission.acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2_mock.id,
            username: user2_mock.username
          },
          access: Permission::ACCESS_READONLY
        }
      ]
      acl1 = permission.acl

      permission.save
      # Here try full reload of model
      permission = Permission.where(id: permission.id).first

      permission.acl = [
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user2_mock.id,
            username: user2_mock.username
          },
          access: Permission::ACCESS_READONLY
        },
        {
          type: Permission::TYPE_USER,
          entity: {
            id: user3_mock.id,
            username: user3_mock.username
          },
          access: Permission::ACCESS_READONLY
        }
      ]
      acl2 = permission.acl


      CartoDB::Permission.expects(:compare_new_acl).with(acl1, acl2).once
      CartoDB::Permission.expects(:compare_new_acl).with(acl2, []).once

      permission.save
      permission.destroy
    end

    it "permission comparisson function should return right diff hash" do
      acl1 = [{:type=>"user", :id=>"17d09bc0-0d14-11e4-a3ef-0800274a1928", :access=>"r"}, {:type=>"user", :id=>"28d09bc0-0d14-11e4-a3ef-0800274a1928", :access=>"r"}]
      acl2 = [{:type=>"user", :id=>"17d09bc0-0d14-11e4-a3ef-0800274a1928", :access=>"r"}, {:type=>"user", :id=>"17d5b1e6-0d14-11e4-a3ef-0800274a1928", :access=>"r"}]

      expected_diff = {
        "user" => {
          "17d5b1e6-0d14-11e4-a3ef-0800274a1928" => [{ "action"=>"grant", "type"=>"r" }],
          "28d09bc0-0d14-11e4-a3ef-0800274a1928" => [{ "action"=>"revoke", "type"=>"r" }]
          }
        }

      CartoDB::Permission.compare_new_acl(acl1, acl2).should == expected_diff
    end

  end

  def prepare_vis_mock_in_permission(viz_id = UUIDTools::UUID.timestamp_create.to_s)
    vis_entity_mock = mock
    vis_entity_mock.stubs(:table).returns(nil)
    vis_entity_mock.stubs(:related_tables).returns([])
    vis_entity_mock.stubs(:table?).returns(true)
    vis_entity_mock.stubs(:invalidate_cache).returns(nil)
    vis_entity_mock.stubs(:type).returns(CartoDB::Visualization::Member::TYPE_DERIVED)
    vis_entity_mock.stubs(:id).returns(viz_id)
    vis_entity_mock.stubs(:name).returns("foobar_visualization")
    Permission.any_instance.stubs(:entity).returns(vis_entity_mock)
  end

end
