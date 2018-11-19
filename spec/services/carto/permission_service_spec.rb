require 'spec_helper_min'

class FakeUser
  def initialize(id)
    @id = id
  end

  def id
    @id
  end
end

describe Carto::PermissionService do
  def create_acl_hash(acl)
    Carto::PermissionService.hashing_acl(acl)
  end

  describe '#diff_by_types' do
    it 'should be empty with grants' do
      old_acl = create_acl_hash([])
      new_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "r" }])
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to be_blank

      old_acl = create_acl_hash([])
      new_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "rw" }])
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to be_blank

      old_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "r" }])
      new_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "r" }])
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to be_blank

      old_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "r" }])
      new_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "rw" }])
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to be_blank

      old_acl = create_acl_hash([])
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "r" }, { "type": "user", "id": "2", "access": "rw" }
        ]
      )
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to be_blank

      old_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "r" },
          { "type": "org", "id": "1", "access": "r" }
        ]
      )
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "r" }
        ]
      )
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to be_blank
    end

    it 'should not be empty with revokes by type' do
      old_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "r" }])
      new_acl = create_acl_hash([])
      expected = { "user" => { "1" => "r" } }
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to eq(expected)

      old_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "rw" }])
      new_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "r" }])
      expected = { "user" => { "1" => "w" } }
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to eq(expected)

      old_acl = create_acl_hash([{ "type": "user", "id": "1", "access": "rw" }])
      new_acl = create_acl_hash([])
      expected = { "user" => { "1" => "rw" } }
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to eq(expected)

      old_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "r" },
          { "type": "user", "id": "2", "access": "rw" }
        ]
      )
      new_acl = create_acl_hash([])
      expected = { "user" => { "1" => "r", "2" => "rw" } }
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to eq(expected)

      old_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "r" }
        ]
      )
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "r" },
          { "type": "org", "id": "1", "access": "r" }
        ]
      )
      expected = { "user" => { "1" => "w" } }
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to eq(expected)

      old_acl = create_acl_hash(
        [
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
      )
      new_acl = create_acl_hash(
        [
          { "type": "group", "id": "1", "access": "r" }
        ]
      )
      expected = { "group" => { "1" => "w" }, "org" => { "1" => "rw" } }
      revokes = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      expect(revokes).to eq(expected)
    end
  end

  describe '#diff_by_users' do
    before :all do
      @users = [FakeUser.new("1"), FakeUser.new("2"), FakeUser.new("3"), FakeUser.new("4")]
    end

    it 'org: rw ---> r' do
      org_revoke = "w"
      new_acl = create_acl_hash([{ "type": "org", "id": "1", "access": "r" }])
      expected = { "user" => { "1" => org_revoke, "2" => org_revoke, "3" => org_revoke, "4" => org_revoke } }
      revokes = Carto::PermissionService.diff_by_users(@users, org_revoke, new_acl)
      expect(revokes).to eq(expected)
    end

    it 'org: rw ---> none' do
      org_revoke = "rw"
      new_acl = create_acl_hash([])
      revokes = Carto::PermissionService.diff_by_users(@users, org_revoke, new_acl)
      expected = { "user" => { "1" => org_revoke, "2" => org_revoke, "3" => org_revoke, "4" => org_revoke } }
      expect(revokes).to eq(expected)
    end

    it 'user1: rw, user2: r, org: rw ---> r' do
      org_revoke = "w"
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" },
          { "type": "org", "id": "1", "access": "r" }
        ]
      )
      expected = { "user" => { "2" => org_revoke, "3" => org_revoke, "4" => org_revoke } }
      revokes = Carto::PermissionService.diff_by_users(@users, org_revoke, new_acl)
      expect(revokes).to eq(expected)
    end

    it 'user1: rw, user2: r, org: r ---> none' do
      org_revoke = "r"
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" }
        ]
      )
      expected = { "user" => { "3" => org_revoke, "4" => org_revoke } }
      revokes = Carto::PermissionService.diff_by_users(@users, org_revoke, new_acl)
      expect(revokes).to eq(expected)
    end

    it 'user1: rw, user2: r, org: rw ---> none' do
      org_revoke = "rw"
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" }
        ]
      )
      expected = { "user" => { "2" => "w", "3" => org_revoke, "4" => org_revoke } }
      revokes = Carto::PermissionService.diff_by_users(@users, org_revoke, new_acl)
      expect(revokes).to eq(expected)
    end
  end

  describe '#revokes_by_user' do
    before :all do
      @users = [FakeUser.new("1"), FakeUser.new("2"), FakeUser.new("3"), FakeUser.new("4")]
    end

    it 'org: rw ---> none; group: rw ---> r' do
      old_acl = create_acl_hash(
        [
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
      )
      new_acl = create_acl_hash(
        [
          { "type": "group", "id": "1", "access": "r" }
        ]
      )

      diff_by_types = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      diff = {}

      # diff by org users
      org_diff = Carto::PermissionService.diff_by_users(@users, diff_by_types['org']['1'], new_acl)
      Carto::PermissionService.add_users_to_diff(diff, org_diff, 'fake_table_owner_id')

      # diff by group users
      group_diff = Carto::PermissionService.diff_by_users(@users, diff_by_types['group']['1'], new_acl)
      Carto::PermissionService.add_users_to_diff(diff, group_diff, 'fake_table_owner_id')

      expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
      expect(diff).to eq(expected)
    end

    it 'user1: rw; org: rw ---> none; group: rw ---> r' do
      old_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
      )
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "r" }
        ]
      )

      diff_by_types = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      diff = {}

      # diff by org users
      org_diff = Carto::PermissionService.diff_by_users(@users, diff_by_types['org']['1'], new_acl)
      Carto::PermissionService.add_users_to_diff(diff, org_diff, 'fake_table_owner_id')

      # diff by group users
      group_diff = Carto::PermissionService.diff_by_users(@users, diff_by_types['group']['1'], new_acl)
      Carto::PermissionService.add_users_to_diff(diff, group_diff, 'fake_table_owner_id')

      expected = { "2" => "w", "3" => "w", "4" => "w" }
      expect(diff).to eq(expected)
    end

    it 'user1: rw; user2: rw ---> none; org: rw ---> none; group: rw ---> r' do
      old_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
      )
      new_acl = create_acl_hash(
        [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "r" }
        ]
      )

      diff_by_types = Carto::PermissionService.diff_by_types(old_acl, new_acl)
      diff = {}

      # diff by org users
      org_diff = Carto::PermissionService.diff_by_users(@users, diff_by_types['org']['1'], new_acl)
      Carto::PermissionService.add_users_to_diff(diff, org_diff, 'fake_table_owner_id')

      # diff by group users
      group_diff = Carto::PermissionService.diff_by_users(@users, diff_by_types['group']['1'], new_acl)
      Carto::PermissionService.add_users_to_diff(diff, group_diff, 'fake_table_owner_id')

      expected = { "2" => "rw", "3" => "w", "4" => "w" }
      expect(diff).to eq(expected)
    end
  end
end
