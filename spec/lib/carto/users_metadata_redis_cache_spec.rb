require_relative '../../spec_helper'
require_relative '../../../lib/carto/user_db_size_cache'

describe Carto::UserDbSizeCache do
  let(:user_mock) do
    OpenStruct.new(id: 'kk', username: 'myusername', db_size_in_bytes: 123)
  end

  let(:updatable_user_mock) do
    user_mock.stubs(:dashboard_viewed_at).returns(Time.now.utc - 2.days)
    user_mock
  end

  let(:umrc) do
    Carto::UserDbSizeCache.new
  end

  describe '#update_if_old' do
    it 'sets db_size_in_bytes for users that have not seen the dashboard in 2 days' do
      umrc.expects(:set_db_size_in_bytes).with(updatable_user_mock).once

      umrc.update_if_old(updatable_user_mock)

      updatable_user_mock.db_size_in_bytes = 0
      umrc.db_size_in_bytes(updatable_user_mock).should == updatable_user_mock.db_size_in_bytes
    end

    it 'does not set db_size_in_bytes for users that have seen the dashboard in 2 hours' do
      user_mock.stubs(:dashboard_viewed_at).returns(Time.now.utc - 2.hours)
      umrc.expects(:set_db_size_in_bytes).never

      umrc.update_if_old(user_mock)
    end
  end

  describe '#db_size_in_bytes_change_users' do
    it 'returns db_size_in_bytes_change in a hash with username keys' do
      umrc.update_if_old(updatable_user_mock)

      db_size_in_bytes_change_users = umrc.db_size_in_bytes_change_users
      db_size_in_bytes_change_users.keys.include?(updatable_user_mock.username).should be_true
      db_size_in_bytes_change_users[updatable_user_mock.username].should == updatable_user_mock.db_size_in_bytes
    end
  end
end
