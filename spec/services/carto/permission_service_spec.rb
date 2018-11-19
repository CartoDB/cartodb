require 'spec_helper_min'

class PermissionServiceMock < Carto::PermissionService
  def self.user_ids(type, id)
    if type == 'user'
      [id]
    else
      ["1", "2", "3", "4"]
    end
  end
end

describe Carto::PermissionService do
  describe '#revokes_by_user' do
    it 'should be empty with grants' do
      old_acl = []
      new_acl = [{ "type": "user", "id": "1", "access": "r" }]
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = []
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = [{ "type": "user", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "r" }]
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = [{ "type": "user", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = []
      new_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "user", "id": "2", "access": "rw" }]
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "org", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "r" }]
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank
    end

    it 'should not be empty with revokes by type' do
      old_acl = [{ "type": "user", "id": "1", "access": "r" }]
      new_acl = []
      expected = { "1" => "r" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      new_acl = [{ "type": "user", "id": "1", "access": "r" }]
      expected = { "1" => "w" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      new_acl = []
      expected = { "1" => "rw" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "user", "id": "2", "access": "rw" }]
      new_acl = []
      expected = { "1" => "r", "2" => "rw" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "org", "id": "1", "access": "r" }]
      expected = { "1" => "w" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    it 'org: rw ---> r' do
      old_acl = [{ "type": "org", "id": "1", "access": "rw" }]
      new_acl = [{ "type": "org", "id": "1", "access": "r" }]
      expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    it 'org: rw ---> none' do
      old_acl = [{ "type": "org", "id": "1", "access": "rw" }]
      new_acl = []
      expected = { "1" => "rw", "2" => "rw", "3" => "rw", "4" => "rw" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    it 'user1: rw, user2: r, org: rw ---> r' do
      old_acl = [
        { "type": "user", "id": "1", "access": "rw" },
        { "type": "user", "id": "2", "access": "r" },
        { "type": "org", "id": "1", "access": "rw" }
      ]
      new_acl = [
        { "type": "user", "id": "1", "access": "rw" },
        { "type": "user", "id": "2", "access": "r" },
        { "type": "org", "id": "1", "access": "r" }
      ]
      expected = { "3" => "w", "4" => "w" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    it 'user1: rw, user2: r, org: r ---> none' do
      old_acl = [
        { "type": "user", "id": "1", "access": "rw" },
        { "type": "user", "id": "2", "access": "r" },
        { "type": "org", "id": "1", "access": "r" }
      ]
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "user", "id": "2", "access": "r" }]
      expected = { "3" => "r", "4" => "r" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    it 'user1: rw, user2: r, org: rw ---> none' do
      old_acl = [
        { "type": "user", "id": "1", "access": "rw" },
        { "type": "user", "id": "2", "access": "r" },
        { "type": "org", "id": "1", "access": "rw" }
      ]
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "user", "id": "2", "access": "r" }]
      expected = { "3" => "rw", "4" => "rw" }
      diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    describe '#users, orgs and groups' do
      it 'org: rw ---> none; group: rw ---> r' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; org: rw ---> none; group: rw ---> r' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" },{ "type": "group", "id": "1", "access": "r" }]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; user2: rw ---> none; org: rw ---> none; group: rw ---> r' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "r" }]
        expected = { "2" => "rw", "3" => "w", "4" => "w" }
        diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; user2: rw ---> none; org: rw ---> none; group: rw ---> r' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" },
          { "type": "group", "id": "1", "access": "r" }
        ]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = PermissionServiceMock.revokes_by_user(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end
    end
  end
end
