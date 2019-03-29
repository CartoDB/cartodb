require 'spec_helper_min'

class DbPermissionServiceMock < Carto::DbPermissionService
  def self.user_ids(type, id)
    if type == 'user'
      [id]
    else
      ["1", "2", "3", "4"]
    end
  end
end

describe Carto::DbPermissionService do
  describe '#revokes_by_user_diff' do
    it 'should be empty with grants' do
      old_acl = []
      new_acl = [{ "type": "user", "id": "1", "access": "r" }]
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = []
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = [{ "type": "user", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "r" }]
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = [{ "type": "user", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = []
      new_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "user", "id": "2", "access": "rw" }]
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank

      old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "org", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "r" }]
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to be_blank
    end

    it 'should not be empty with revokes by type' do
      old_acl = [{ "type": "user", "id": "1", "access": "r" }]
      new_acl = []
      expected = { "1" => "r" }
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      new_acl = [{ "type": "user", "id": "1", "access": "r" }]
      expected = { "1" => "w" }
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "rw" }]
      new_acl = []
      expected = { "1" => "rw" }
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "user", "id": "2", "access": "rw" }]
      new_acl = []
      expected = { "1" => "r", "2" => "rw" }
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)

      old_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "r" }]
      new_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "org", "id": "1", "access": "r" }]
      expected = { "1" => "w" }
      diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
      expect(diff).to eq(expected)
    end

    describe '#orgs and groups' do
      it 'org: rw ---> r' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'org: rw ---> none' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }]
        new_acl = []
        expected = { "1" => "rw", "2" => "rw", "3" => "rw", "4" => "rw" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'org: r ---> none' do
        old_acl = [{ "type": "org", "id": "1", "access": "r" }]
        new_acl = []
        expected = { "1" => "r", "2" => "r", "3" => "r", "4" => "r" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'org: rw ---> none; group: rw ---> r' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'org: rw ---> r; group: rw ---> none' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'org: rw; group: rw ---> none' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group: rw; org: rw ---> none' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "org", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end
    end

    describe '#several orgs or groups' do
      it 'org1: rw; org2: rw ---> none' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }, { "type": "org", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'org1: rw; org2: rw ---> r' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }, { "type": "org", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'org1: rw ---> r; org2: rw ---> none' do
        old_acl = [{ "type": "org", "id": "1", "access": "rw" }, { "type": "org", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'group1: rw; group2: rw ---> none' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "group", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group1: rw; group2: rw ---> r' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "group", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group1: rw ---> r; group2: rw ---> none' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "group", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; group1: rw ---> r; group2: rw ---> none' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" }
        ]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "r" }]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: r; group1: rw ---> r; group2: rw ---> none' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }, { "type": "group", "id": "2", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end
    end

    describe '#users and orgs or groups' do
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
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
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
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw, user2: r, org: rw ---> none' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "user", "id": "2", "access": "r" }]
        expected = { "2" => "w", "3" => "rw", "4" => "rw" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end
    end

    describe '#users, orgs and groups' do
      it 'user1: rw; org: rw ---> none; group: rw ---> r' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "r" }]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; user2: r; org: r ---> none; group: rw ---> r' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" },
          { "type": "group", "id": "1", "access": "r" }
        ]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; user2: r; org: r ---> none; group: rw ---> none' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" },
          { "type": "org", "id": "1", "access": "r" },
          { "type": "group", "id": "1", "access": "rw" }
        ]
        new_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "r" }
        ]
        expected = { "2" => "w", "3" => "rw", "4" => "rw" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; user2: rw ---> none; user3: rw ---> r; org: rw; group: rw' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "rw" },
          { "type": "user", "id": "3", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "3", "access": "r" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'user1: rw; user2: rw ---> none; org: rw ---> none; group: rw ---> r' do
        old_acl = [
          { "type": "user", "id": "1", "access": "rw" },
          { "type": "user", "id": "2", "access": "rw" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "r" }]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end
    end

    describe '#grants and revokes' do
      it 'group1: rw ---> none; group2: none ---> rw;' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "2", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group1: rw ---> none; org1: none ---> rw;' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "org", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group1: rw ---> r; group2: none ---> rw;' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "r" }, { "type": "group", "id": "2", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group1: rw ---> r; org1: none ---> rw;' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "1", "access": "r" }, { "type": "org", "id": "1", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'group1: rw ---> none; group2: none ---> r;' do
        old_acl = [{ "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "group", "id": "2", "access": "r" }]
        expected = { "1" => "w", "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: rw; group1: rw ---> none; group2: none ---> rw;' do
        old_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "2", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'user1: r; group1: rw ---> none; group2: none ---> rw;' do
        old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "group", "id": "2", "access": "rw" }]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end

      it 'user1: rw; group1: rw ---> none; group2: none ---> r;' do
        old_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "2", "access": "r" }]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: r ---> rw; group1: rw ---> none;' do
        old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }]
        expected = { "2" => "rw", "3" => "rw", "4" => "rw" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: r ---> rw; group1: rw ---> r;' do
        old_acl = [{ "type": "user", "id": "1", "access": "r" }, { "type": "group", "id": "1", "access": "rw" }]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }, { "type": "group", "id": "1", "access": "r" }]
        expected = { "2" => "w", "3" => "w", "4" => "w" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: none ---> rw; group1: r ---> none;' do
        old_acl = [{ "type": "group", "id": "1", "access": "r" }]
        new_acl = [{ "type": "user", "id": "1", "access": "rw" }]
        expected = { "2" => "r", "3" => "r", "4" => "r" }
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to eq(expected)
      end

      it 'user1: none ---> r; group1: r ---> rw; org1: rw ---> r;' do
        old_acl = [
          { "type": "group", "id": "1", "access": "r" },
          { "type": "org", "id": "1", "access": "rw" }
        ]
        new_acl = [
          { "type": "user", "id": "1", "access": "r" },
          { "type": "group", "id": "1", "access": "rw" },
          { "type": "org", "id": "1", "access": "r" }
        ]
        diff = DbPermissionServiceMock.revokes_by_user_diff(old_acl, new_acl, 'fake_table_owner_id')
        expect(diff).to be_blank
      end
    end
  end
end
