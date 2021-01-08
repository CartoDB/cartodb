require_relative '../../../spec_helper'

describe Carto::Visualization::Watcher do
  before(:all) do
    $tables_metadata.flushdb
  end

  after(:all) do
    $tables_metadata.flushdb
  end

  describe '#basic_tests' do
    it 'tests notify and list methods' do
      watcher_ttl = 2

      org_id = Carto::UUIDHelper.random_uuid
      organization_mock = double
      allow(organization_mock).to receive(:id).and_return(org_id)

      # Normal user
      user1_name = 'wadus1'
      user1_mock = double
      allow(user1_mock).to receive(:username).and_return(user1_name)
      allow(user1_mock).to receive(:organization).and_return(organization_mock)

      #Another org user
      user2_name = 'wadus2'
      user2_mock = double
      allow(user2_mock).to receive(:username).and_return(user2_name)
      allow(user2_mock).to receive(:organization).and_return(organization_mock)

      vis_id = Carto::UUIDHelper.random_uuid
      visualization_mock = double
      allow(visualization_mock).to receive(:id).and_return(vis_id)

      # Try to create a watcher from a non-org user
      expect {
        non_org_user_mock = double
        allow(non_org_user_mock).to receive(:organization).and_return(nil)
        Carto::Visualization::Watcher.new(non_org_user_mock, visualization_mock)
      }.to raise_exception Carto::Visualization::WatcherError

      u1_watcher = Carto::Visualization::Watcher.new(user1_mock, visualization_mock, watcher_ttl)
      u1_watcher.nil?.should eq false
      u1_watcher.list.should eq []

      u1_watcher.notify
      u1_watcher.list.should eq [user1_mock.username]

      sleep(watcher_ttl+1)
      u1_watcher.list.should eq []

      u1_watcher.notify
      u1_watcher.list.should eq [user1_mock.username]

      u2_watcher = Carto::Visualization::Watcher.new(user2_mock, visualization_mock, watcher_ttl)
      u2_watcher.nil?.should eq false
      # All watchers must notify all users
      u2_watcher.list.should eq [user1_mock.username]

      u2_watcher.notify
      # Both watchers should be now updated
      (u2_watcher.list - [user1_mock.username, user2_mock.username]).should eq []
      (u1_watcher.list - [user1_mock.username, user2_mock.username]).should eq []

      sleep(watcher_ttl+1)
      # And empty
      u1_watcher.list.should eq []
      u2_watcher.list.should eq []

      u2_watcher.notify
      sleep(1)
      u1_watcher.list.should eq [user2_mock.username]
      u2_watcher.list.should eq [user2_mock.username]
    end
  end
end
