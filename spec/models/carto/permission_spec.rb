require 'spec_helper_unit'

describe Carto::Permission do
  include Carto::Factories::Visualizations

  let!(:user) { create(:carto_user, quota_in_bytes: 524_288_000, table_quota: 500, factory_bot_context: { only_db_setup: true }) }
  let(:user2) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:user3) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:user4) { create(:carto_user_light) }
  let(:viewer_user) { create(:carto_user, viewer: true, factory_bot_context: { only_db_setup: true }) }
  let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }

  before do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    ::User.any_instance.stubs(:gravatar).returns(nil)
  end

  describe '#create' do
    it 'tests basic creation' do
      visualization = create(:carto_visualization, user: user.carto_user)
      entity_id = visualization.id
      entity_type = Carto::Permission::ENTITY_TYPE_VISUALIZATION

      permission = Carto::Visualization.find(entity_id).permission
      permission.id.should_not eq nil
      permission.acl.should eq []
      permission.owner_id.should eq user.id
      permission.owner_username.should eq user.username
      permission.entity_id.should eq entity_id
      permission.entity_type.should eq entity_type

      acl_with_data = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]

      acl_with_data_expected = [
        {
          type: acl_with_data[0][:type],
          id:   acl_with_data[0][:entity][:id],
          access: acl_with_data[0][:access]
        }
      ]

      permission.acl = acl_with_data
      permission.save

      permission.acl.should eq acl_with_data_expected

      permission.acl = nil
      permission.acl.should eq []

      # Missing owner
      permission2 = described_class.new
      expect {
        permission2.save
      }.to raise_exception

      # Owner helper methods
      permission2 = described_class.new
      permission2.owner = user.carto_user
      permission2.save
      permission2.owner.should eq user.carto_user
      permission2.owner_id.should eq user.id
      permission2.owner_username.should eq user.username
      permission2.delete

      # Entity helper methods
      visualization2 = create(:carto_visualization, user: Carto::User.find(user.id))
      permission2 = Carto::Visualization.find(visualization2.id).permission

      # invalid ACL formats
      expect {
        permission2.acl = 'not an array!'
      }.to raise_exception Carto::Permission::Error

      expect {
        permission2.acl = [
          'aaa'
        ]
      }.to raise_exception Carto::Permission::Error

      expect {
        permission2.acl = [
          {}
        ]
      }.to raise_exception Carto::Permission::Error

      expect {
        permission2.acl = [
          {
            # missing fields
            wadus: 'aaa'
          }
        ]
      }.to raise_exception Carto::Permission::Error

      permission2.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READONLY,
          # Extra undesired field
          wadus: 'aaa'
        }
      ]

      # Wrong permission access
      expect {
        permission2.acl = [
          {
            type: Carto::Permission::TYPE_USER,
            entity: {
              id: user2.id,
              username: user2.username
            },
            access: '123'
          }
        ]
      }.to raise_exception Carto::Permission::Error

      visualization.destroy
      visualization2.destroy
    end

    it 'deals with deleted users gracefully' do
      user_to_be_deleted = create(:carto_user, factory_bot_context: { only_db_setup: true })
      map, table, table_visualization, visualization = create_full_visualization(
        user.carto_user,
        visualization_attributes: { type: Carto::Visualization::TYPE_CANONICAL }
      )
      entity_id = table_visualization.id
      permission = Carto::Visualization.find(entity_id).permission
      acl_with_data = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url
          },
          access: Carto::Permission::ACCESS_READONLY
        },
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user_to_be_deleted.id,
            username: user_to_be_deleted.username,
            avatar_url: user_to_be_deleted.avatar_url
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      permission.acl = acl_with_data
      permission.save
      # here there's a possible race condition, when updating permissions
      user_to_be_deleted.delete
      acl_from_db = CartoDB::PermissionPresenter.new(permission).to_poro[:acl]
      filtered_acl = acl_from_db.map do |entry|
        {
          type: entry[:type],
          entity: entry[:entity].select { |k, _v| Carto::Permission::ALLOWED_ENTITY_KEYS.include?(k) },
          access: entry[:access]
        }
      end
      permission.acl = filtered_acl
      permission.save
      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'fails granting write permission for viewer users' do
      visualization = create(:carto_visualization, type: 'table', user: Carto::User.find(user.id))
      permission = visualization.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: viewer_user.id,
            username: viewer_user.username
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]

      expect {
        permission.save!
      }.to raise_error(ActiveRecord::RecordInvalid, /grants write to viewers: #{viewer_user.username}/)

      visualization.destroy
    end

    it 'allows granting read permission for viewer users' do
      map, table, table_visualization, visualization = create_full_visualization(
        user.carto_user,
        visualization_attributes: { type: Carto::Visualization::TYPE_CANONICAL }
      )
      permission = table_visualization.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: viewer_user.id,
            username: viewer_user.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]

      permission.save
      permission.reload

      permission.permission_for_user(viewer_user).should eq Carto::Permission::ACCESS_READONLY

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'changes RW to RO permission to builders becoming viewers' do
      changing_user = create_user(viewer: false)

      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)

      permission = table_visualization.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: changing_user.id,
            username: changing_user.username
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      Table.any_instance.expects(:add_read_write_permission).once.returns(true)
      permission.save
      permission.reload

      permission.permission_for_user(changing_user).should eq Carto::Permission::ACCESS_READWRITE

      changing_user.viewer = true
      Table.any_instance.expects(:remove_access).once.returns(true)
      Table.any_instance.expects(:add_read_permission).once.returns(true)
      changing_user.save
      changing_user.reload

      permission.reload
      permission.permission_for_user(changing_user).should eq Carto::Permission::ACCESS_READONLY

      destroy_full_visualization(map, table, table_visualization, visualization)

      changing_user.destroy
    end

    it 'supports groups' do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)

      entity_id = visualization.id
      entity_type = Carto::Permission::ENTITY_TYPE_VISUALIZATION

      organization = create(:organization)
      group = create(:random_group, organization: organization)

      acl_initial = []
      acl_with_data = [
        {
          type: Carto::Permission::TYPE_GROUP,
          entity: {
            id: group.id,
            username: 'a_group'
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      acl_with_data_expected = [
        {
          type: acl_with_data[0][:type],
          id:   acl_with_data[0][:entity][:id],
          access: acl_with_data[0][:access]
        }
      ]

      permission = visualization.permission
      permission.id.should_not eq nil
      permission.acl.should eq acl_initial
      permission.owner_id.should eq user.id
      permission.owner_username.should eq user.username
      permission.entity_id.should eq entity_id
      permission.entity_type.should eq entity_type

      permission.acl = acl_with_data
      permission.save

      permission.acl.should eq acl_with_data_expected

      permission.acl = nil
      permission.acl.should eq acl_initial

      destroy_full_visualization(map, table, table_visualization, visualization)
    end
  end

  describe '#permissions_methods' do
    it 'checks permission_for_user and is_owner methods' do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)
      permission = table_visualization.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]

      permission.save

      permission = table_visualization.permission

      permission.should_not eq nil

      permission.is_owner?(user).should eq true
      permission.is_owner?(user2).should eq false
      permission.is_owner?(user3).should eq false

      permission.permission_for_user(user).should eq Carto::Permission::ACCESS_READWRITE
      permission.permission_for_user(user2).should eq Carto::Permission::ACCESS_READONLY
      permission.permission_for_user(user3).should eq Carto::Permission::ACCESS_NONE

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'checks is_permitted' do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)
      permission = table_visualization.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READONLY
        },
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user3.id,
            username: user3.username
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      permission.save

      permission.permitted?(user2, Carto::Permission::ACCESS_READONLY).should eq true
      permission.permitted?(user2, Carto::Permission::ACCESS_READWRITE).should eq false

      permission.permitted?(user3, Carto::Permission::ACCESS_READONLY).should eq true
      permission.permitted?(user3, Carto::Permission::ACCESS_READWRITE).should eq true

      permission.permitted?(user4, Carto::Permission::ACCESS_READONLY).should eq false
      permission.permitted?(user4, Carto::Permission::ACCESS_READWRITE).should eq false

      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it 'checks organizations vs users permissions precedence' do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)
      permission = table_visualization.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: organization.owner.id,
            username: organization.owner.username
          },
          access: Carto::Permission::ACCESS_READWRITE
        },
        {
          type: Carto::Permission::TYPE_ORGANIZATION,
          entity: {
            id: organization.id,
            username: organization.name
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      permission.save
      permission.permitted?(organization.owner, Carto::Permission::ACCESS_READONLY).should eq true
      permission.permitted?(organization.owner, Carto::Permission::ACCESS_READWRITE).should eq true

      # Organization has more permissions than user. Should get inherited (RW prevails)
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: organization.owner.id,
            username: organization.owner.username
          },
          access: Carto::Permission::ACCESS_READONLY
        },
        {
          type: Carto::Permission::TYPE_ORGANIZATION,
          entity: {
            id: organization.id,
            username: organization.name
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      permission.save
      permission.permitted?(organization.owner, Carto::Permission::ACCESS_READONLY).should eq true
      permission.permitted?(organization.owner, Carto::Permission::ACCESS_READWRITE).should eq true

      # Organization permission only
      permission.acl = [
        {
          type: Carto::Permission::TYPE_ORGANIZATION,
          entity: {
            id: organization.id,
            username: organization.name
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      permission.save

      permission.permitted?(organization.owner, Carto::Permission::ACCESS_READONLY).should eq true
      permission.permitted?(organization.owner, Carto::Permission::ACCESS_READWRITE).should eq true

      destroy_full_visualization(map, table, table_visualization, visualization)
      organization.destroy_cascade
    end

  end

  describe '#shared_entities' do
    before do
      @map, @table, @table_visualization, @visualization = create_full_visualization(user.carto_user)
    end

    it 'tests the management of shared entities upon permission save (based on its ACL)' do
      entity_id = @table_visualization.id
      permission = @table_visualization.permission
      # Create old entries
      Carto::SharedEntity.create(
        recipient_id: user.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id: entity_id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
      Carto::SharedEntity.create(
        recipient_id: user2.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id: entity_id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      Carto::SharedEntity.where(entity_id: entity_id).count.should eq 2

      # Leave only user 1
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user.id,
            username: user.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      # shared entry of user 2 should dissapear
      permission.save

      Carto::SharedEntity.where(entity_id: entity_id).count.should eq 1
      shared_entity = Carto::SharedEntity.find_by(entity_id: entity_id)
      shared_entity.recipient_id.should eq user.id
      shared_entity.entity_id.should eq entity_id

      # Leave only user 2 now
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READWRITE
        }
      ]
      permission.save

      Carto::SharedEntity.where(entity_id: entity_id).count.should eq 1
      shared_entity = Carto::SharedEntity.find_by(entity_id: entity_id)
      shared_entity.recipient_id.should eq user2.id
      shared_entity.entity_id.should eq entity_id

      # Now just change permission, user2 should still be there
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      permission.save

      Carto::SharedEntity.where(entity_id: entity_id).count.should eq 1
      shared_entity = Carto::SharedEntity.find_by(entity_id: entity_id)
      shared_entity.recipient_id.should eq user2.id
      shared_entity.entity_id.should eq entity_id

      # Now set a permission forbidding a user, so should dissapear too
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_NONE
        }
      ]
      permission.save

      Carto::SharedEntity.where(entity_id: entity_id).count.should eq 0
    end

    it 'triggers table metadata update (to purgue caches, for example) if a permission is removed' do
      entity_id = @table_visualization.id
      permission = @table_visualization.permission

      Carto::SharedEntity.create(
        recipient_id: user.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id: entity_id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )

      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user.id,
            username: user.username
          },
          access: Carto::Permission::ACCESS_NONE
        }
      ]
      ::Table.any_instance.expects(:update_cdb_tablemetadata)
      permission.save
    end
  end

  describe "permissions diffs" do
    it "should enqueue the right notification email" do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)
      entity_id = visualization.id
      permission = visualization.permission

      user2_id = "17d5b1e6-0d14-11e4-a3ef-0800274a1928"
      user3_id = "28d09bc0-0d14-11e4-a3ef-0800274a1928"
      permissions_changes = {
        "user" => {
          user2_id => [{ "action" => "grant", "type" => "r" }],
          user3_id => [{ "action" => "revoke", "type" => "r" }]
        }
      }

      ::Resque.stubs(:enqueue).returns(nil)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::ShareVisualization, permission.entity.id, user2_id).once
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::UnshareVisualization,
                                      permission.entity.name, permission.owner_username, user3_id).once

      permission.notify_permissions_change(permissions_changes)
      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it "enqueues notifications for kuviz" do
      visualization = create(:kuviz_visualization, user: user.carto_user)
      entity_id = visualization.id
      permission = visualization.permission

      user2_id = "17d5b1e6-0d14-11e4-a3ef-0800274a1928"
      user3_id = "28d09bc0-0d14-11e4-a3ef-0800274a1928"
      permissions_changes = {
        "user" => {
          user2_id => [{ "action" => "grant", "type" => "r" }],
          user3_id => [{ "action" => "revoke", "type" => "r" }]
        }
      }

      ::Resque.stubs(:enqueue).returns(nil)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::ShareVisualization, permission.entity.id, user2_id).once
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::UnshareVisualization,
                                      permission.entity.name, permission.owner_username, user3_id).once

      permission.notify_permissions_change(permissions_changes)
      visualization.destroy
    end

    it "enqueues notifications for app" do
      visualization = create(:app_visualization, user: user.carto_user)
      entity_id = visualization.id
      permission = visualization.permission

      user2_id = "17d5b1e6-0d14-11e4-a3ef-0800274a1928"
      user3_id = "28d09bc0-0d14-11e4-a3ef-0800274a1928"
      permissions_changes = {
        "user" => {
          user2_id => [{ "action" => "grant", "type" => "r" }],
          user3_id => [{ "action" => "revoke", "type" => "r" }]
        }
      }

      ::Resque.stubs(:enqueue).returns(nil)

      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::ShareVisualization, permission.entity.id, user2_id).once
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::UnshareVisualization,
                                      permission.entity.name, permission.owner_username, user3_id).once

      permission.notify_permissions_change(permissions_changes)
      visualization.destroy
    end

    it "should call the permissions comparison function with correct values" do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)
      permission = visualization.permission

      Resque.stubs(:enqueue).returns(nil)

      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READONLY
        },
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user3.id,
            username: user3.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      original_acl = permission.acl

      described_class.expects(:compare_new_acl).once
      permission.save

      expect(permission.acl).to eq(original_acl)

      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: user2.id,
            username: user2.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      updated_acl = permission.acl

      described_class.expects(:compare_new_acl).once
      permission.save

      expect(permission.acl).to eq(updated_acl)

      described_class.expects(:compare_new_acl).with(updated_acl, []).once
      # Hack to workaround FK while keeping the destroy test
      fake_permission = create(:carto_permission, owner_id: user.id)
      visualization.update_column(:permission_id, fake_permission.id)
      permission.destroy

      described_class.expects(:compare_new_acl).with([], []).at_least_once
      destroy_full_visualization(map, table, table_visualization, visualization)
    end

    it "permission comparisson function should return right diff hash" do
      acl1 = [
        { type: "user", id: "17d09bc0-0d14-11e4-a3ef-0800274a1928", access: "r" },
        { type: "user", id: "28d09bc0-0d14-11e4-a3ef-0800274a1928", access: "r" }
      ]
      acl2 = [
        { type: "user", id: "17d09bc0-0d14-11e4-a3ef-0800274a1928", access: "r" },
        { type: "user", id: "17d5b1e6-0d14-11e4-a3ef-0800274a1928", access: "r" }
      ]

      expected_diff = {
        "user" => {
          "17d5b1e6-0d14-11e4-a3ef-0800274a1928" => [{ "action" => "grant", "type" => "r" }],
          "28d09bc0-0d14-11e4-a3ef-0800274a1928" => [{ "action" => "revoke", "type" => "r" }]
        }
      }

      Carto::Permission.compare_new_acl(acl1, acl2).should == expected_diff
    end
  end

  describe '#set_user_permission and #remove_user_permission' do
    it 'sets and removes user permission' do
      map, table, table_visualization, visualization = create_full_visualization(user.carto_user)
      permission = table_visualization.permission

      permission.set_user_permission(user2, Carto::Permission::ACCESS_READONLY)
      permission.save
      visualization = Carto::Visualization.find(table_visualization.id)
      visualization.has_permission?(user2, Carto::Permission::ACCESS_READONLY).should be_true
      visualization.has_permission?(user2, Carto::Permission::ACCESS_READWRITE).should be_false

      # Permission is reassigned because current design doesn't works well with several changes in a row.
      permission = table_visualization.permission
      permission.remove_user_permission(user2)
      permission.save
      visualization = Carto::Visualization.find(table_visualization.id)
      visualization.has_permission?(user2, Carto::Permission::ACCESS_READONLY).should be_false
      visualization.has_permission?(user2, Carto::Permission::ACCESS_READWRITE).should be_false

      permission = table_visualization.permission
      permission.set_user_permission(user2, Carto::Permission::ACCESS_READWRITE)
      permission.save
      visualization = Carto::Visualization.find(table_visualization.id)
      visualization.has_permission?(user2, Carto::Permission::ACCESS_READONLY).should be_true
      visualization.has_permission?(user2, Carto::Permission::ACCESS_READWRITE).should be_true

      destroy_full_visualization(map, table, table_visualization, visualization)
    end
  end

  describe 'permission cleanup on deletions' do
    describe 'sharing' do
      include Carto::Factories::Visualizations

      let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
      let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
      let(:organization_user) do
        create(
          :carto_user,
          organization_id: organization.id,
          factory_bot_context: { only_db_setup: true }
        )
      end
      let(:group) { create(:random_group, organization_id: organization.id) }

      it 'deletes ACL entries from permissions on user deletion' do
        _, table, = create_full_visualization(organization.owner)

        permission = table.permission
        permission.acl = [
          {
            type: Carto::Permission::TYPE_USER,
            entity: { id: organization_user.id },
            access: Carto::Permission::ACCESS_READONLY
          }
        ]
        permission.save
        permission.acl.map { |a| a[:id] }.should include(organization_user.id)
        permission.entities_with_read_permission.should include(organization_user)

        organization_user.sequel_user.destroy

        permission.reload
        permission.acl.map { |a| a[:id] }.should_not include(organization_user.id)
        permission.entities_with_read_permission.should_not include(organization_user)
      end

      it 'deletes ACL entries from permissions on deletion' do
        map, table, table_visualization, visualization = create_full_visualization(organization.owner)

        Carto::Group.any_instance.expects(:grant_db_permission).once
        permission = table.permission
        permission.acl = [
          {
            type: Carto::Permission::TYPE_GROUP,
            entity: { id: group.id },
            access: Carto::Permission::ACCESS_READONLY
          }
        ]
        permission.save
        permission.acl.map { |a| a[:id] }.should include(group.id)
        permission.entities_with_read_permission.should include(group)

        group.destroy

        permission.reload
        permission.acl.map { |a| a[:id] }.should_not include(group.id)
        permission.entities_with_read_permission.should_not include(group)

        destroy_full_visualization(map, table, table_visualization, visualization)
      end
    end
  end
end
