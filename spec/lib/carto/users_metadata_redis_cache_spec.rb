require_relative '../../spec_helper'
require_relative '../../../lib/carto/user_db_size_cache'

describe Carto::UserDbSizeCache do
  let(:user_mock) do
    OpenStruct.new(id: 'kk', username: 'myusername', db_size_in_bytes: 123)
  end

  let(:umrc) do
    Carto::UserDbSizeCache.new
  end

  let(:redis_key) do
    umrc.send(:db_size_in_bytes_key, user_mock.username)
  end

  before(:each) do
    $users_metadata.del(redis_key)
  end

  describe '#update_if_old' do
    it 'sets db_size_in_bytes for users that have not been updated in 2 days' do
      umrc.expects(:set_db_size_in_bytes).with(user_mock).once
      umrc.update_if_old(user_mock)

      umrc.db_size_in_bytes(user_mock).should eq 0
    end

    it 'does not set db_size_in_bytes for users that have been updated in an hour' do
      $users_metadata.setex(redis_key, 2.days - 1.hour, 456)
      umrc.expects(:set_db_size_in_bytes).never

      umrc.update_if_old(user_mock)
    end
  end

  describe '#db_size_in_bytes_change_users' do
    it 'returns db_size_in_bytes_change in a hash with username keys' do
      umrc.update_if_old(user_mock)

      db_size_in_bytes_change_users = umrc.db_size_in_bytes_change_users
      db_size_in_bytes_change_users.keys.include?(user_mock.username).should be_true
      db_size_in_bytes_change_users[user_mock.username].should == user_mock.db_size_in_bytes
    end
  end
end
