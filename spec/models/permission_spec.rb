# coding: UTF-8

require_relative '../spec_helper'

include CartoDB

describe CartoDB::Permission do

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
  end

  describe '#create' do
    it 'tests basic creation' do
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
        owner_username: @user.username
        #check default acl is correct
      )
      permission.save

      permission.id.should_not eq nil
      permission.owner_id.should eq @user.id
      permission.owner_username.should eq @user.username
      permission.acl.should eq acl_initial

      permission.acl = acl_with_data
      permission.save

      permission.acl.should eq acl_with_data_expected

      # Nil should reset to default value
      permission.acl = nil
      permission.acl.should eq acl_initial

      # Missing owner
      permission2 = Permission.new
      expect {
        permission2.save
      }.to raise_exception

      # Owner helper methods
      permission2.owner = @user
      permission2.save
      permission2.owner.should eq @user
      permission2.owner_id.should eq @user.id
      permission2.owner_username.should eq @user.username

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

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username
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

      permission = Permission.new(
        owner_id:       @user.id,
        owner_username: @user.username
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

    # TODO: Add organization permissions spec
    it 'checks organizations vs users permissions precedence' do
      org_mock = mock
      org_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      org_mock.stubs(:name).returns('some_org')
      user2_mock = mock
      user2_mock.stubs(:id).returns(UUIDTools::UUID.timestamp_create.to_s)
      user2_mock.stubs(:username).returns('user2')
      user2_mock.stubs(:organization).returns(org_mock)

      permission = Permission.new(
          owner_id:       @user.id,
          owner_username: @user.username
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

end
