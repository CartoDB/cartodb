require 'spec_helper_min'

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
    end
  end

  describe '#diff_by_org_users' do
    class FakeUser
      def initialize(id)
        @id = id
      end

      def id
        @id
      end
    end

    before :all do
      @org_users = [FakeUser.new("1"), FakeUser.new("2"), FakeUser.new("3"), FakeUser.new("4")]
    end

    it 'org: rw ---> r' do
      org_revoke = "w"
      new_acl = create_acl_hash([{ "type": "org", "id": "1", "access": "r" }])
      expected = { "user" => { "1" => org_revoke, "2" => org_revoke, "3" => org_revoke, "4" => org_revoke } }
      revokes = Carto::PermissionService.diff_by_org_users(@org_users, org_revoke, new_acl)
      expect(revokes).to eq(expected)
    end

    it 'org: rw ---> none' do
      org_revoke = "rw"
      new_acl = create_acl_hash([])
      revokes = Carto::PermissionService.diff_by_org_users(@org_users, org_revoke, new_acl)
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
      revokes = Carto::PermissionService.diff_by_org_users(@org_users, org_revoke, new_acl)
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
      revokes = Carto::PermissionService.diff_by_org_users(@org_users, org_revoke, new_acl)
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
      revokes = Carto::PermissionService.diff_by_org_users(@org_users, org_revoke, new_acl)
      expect(revokes).to eq(expected)
    end
  end
end
