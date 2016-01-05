require_relative '../../spec_helper'
require_relative '../../../lib/carto/users_metadata_redis_cache'

describe Carto::UsersMetadataRedisCache do
  let(:user_mock) do
    OpenStruct.new(id: 'kk', username: 'myusername', db_size_in_bytes: 123)
  end

  let(:umrc) do
    Carto::UsersMetadataRedisCache.new
  end

  describe '#update_if_old' do
    it 'sets db_size_in_bytes for users that have not seen the dashboard in 2 days' do
      user_mock.stubs(:dashboard_viewed_at).returns(Time.now.utc - 2.days)
      umrc.expects(:set_db_size_in_bytes).with(user_mock).once

      umrc.update_if_old(user_mock)

      user_mock.db_size_in_bytes = 0
      umrc.db_size_in_bytes(user_mock).should == user_mock.db_size_in_bytes
    end

    it 'does not set db_size_in_bytes for users that have seen the dashboard in 2 hours' do
      user_mock.stubs(:dashboard_viewed_at).returns(Time.now.utc - 2.hours)
      umrc.expects(:set_db_size_in_bytes).never

      umrc.update_if_old(user_mock)
    end
  end

end
