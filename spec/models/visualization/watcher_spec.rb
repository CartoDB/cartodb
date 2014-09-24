# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/watcher'
require 'delorean'

include CartoDB::Visualization

describe TableBlender do

  before(:all) do
    $tables_metadata.flushdb

    vis_id = UUIDTools::UUID.timestamp_create.to_s
    @visualization_mock = mock
    @visualization_mock.stubs(:id).returns(vis_id)

    # Organization
    org_id = UUIDTools::UUID.timestamp_create.to_s
    organization_mock = mock
    organization_mock.stubs(:id).returns(org_id)

    # Normal org user
    user1_name = 'wadus1'
    @user1_mock = mock
    @user1_mock.stubs(:username).returns(user1_name)
    @user1_mock.stubs(:organization).returns(organization_mock)

    # Another org user
    user2_name = 'wadus2'
    @user2_mock = mock
    @user2_mock.stubs(:username).returns(user2_name)
    @user2_mock.stubs(:organization).returns(organization_mock)


    @watcher_ttl = Cartodb.config[:watcher].present? ? Cartodb.config[:watcher].try("fetch", 'ttl', 60) : 60
  end

  after(:all) do
    $tables_metadata.flushdb
  end

  after(:each) do
    Delorean.back_to_the_present
  end

  describe '#basic_tests' do
    it 'should fail to initialize a watcher for non organization users' do
      # Try to create a watcher from a non-org user
      expect {
        non_org_user_mock = mock
        non_org_user_mock.stubs(:organization).returns(nil)
        Watcher.new(non_org_user_mock, @visualization_mock)
      }.to raise_exception WatcherError
    end

    it 'should report user and remove after ttl' do
      u1_watcher = Watcher.new(@user1_mock, @visualization_mock)
      u1_watcher.nil?.should eq false
      u1_watcher.list.should eq []

      u1_watcher.notify
      u1_watcher.list.should eq [@user1_mock.username]

      Delorean.jump @watcher_ttl + 1
      u1_watcher.list.should eq []

      u1_watcher.notify
      u1_watcher.list.should eq [@user1_mock.username]
    end

    it 'should report other user is in visualization' do
      u1_watcher = Watcher.new(@user1_mock, @visualization_mock)
      u1_watcher.notify

      u2_watcher = Watcher.new(@user2_mock, @visualization_mock)
      u2_watcher.list.should eq [@user1_mock.username]
    end

    it 'should report both users are in visualization from both watchers and removed after the ttl' do
      u1_watcher = Watcher.new(@user1_mock, @visualization_mock)
      u1_watcher.notify

      u2_watcher = Watcher.new(@user2_mock, @visualization_mock)
      u2_watcher.notify

      u1_watcher.list.should eq [@user1_mock.username, @user2_mock.username]
      u2_watcher.list.should eq [@user1_mock.username, @user2_mock.username]

      Delorean.jump @watcher_ttl + 1
      u1_watcher.list.should eq []
      u2_watcher.list.should eq []

      u2_watcher.notify
      Delorean.jump 1
      u1_watcher.list.should eq [@user2_mock.username]
      u2_watcher.list.should eq [@user2_mock.username]
    end

    it 'should have usernames in redis after they have `expired` and removed after pruning' do
      u1_watcher = Watcher.new(@user1_mock, @visualization_mock)
      u1_watcher.notify
      u2_watcher = Watcher.new(@user2_mock, @visualization_mock)
      u2_watcher.notify

      Delorean.jump @watcher_ttl + 1
      u1_watcher.list.should eq []
      u2_watcher.list.should eq []

      redis_key = u1_watcher.send(:key)
      $tables_metadata.zrange(redis_key, 0, Time.now.utc.to_i).should eq [@user1_mock.username, @user2_mock.username]

      u1_watcher.prune

      $tables_metadata.zrange(redis_key, 0, Time.now.utc.to_i).should eq []
    end

    it 'should prune only users older than the ttl' do
      u1_watcher = Watcher.new(@user1_mock, @visualization_mock)
      u1_watcher.notify

      Delorean.jump @watcher_ttl - 5

      u2_watcher = Watcher.new(@user2_mock, @visualization_mock)
      u2_watcher.notify

      Delorean.jump @watcher_ttl - 5 + 1

      u1_watcher.prune

      redis_key = u1_watcher.send(:key)
      $tables_metadata.zrange(redis_key, 0, Time.now.utc.to_i).should eq [@user2_mock.username]

    end
  end

end

