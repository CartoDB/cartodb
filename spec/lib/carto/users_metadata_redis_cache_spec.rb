require_relative '../../spec_helper'
require_relative '../../../lib/carto/users_metadata_redis_cache'

describe Carto::UsersMetadataRedisCache do
  let(:user_mock) do
    OpenStruct.new(id: 'kk', username:'myusername', db_size_in_bytes: 123)
  end

  describe '#set_db_size_in_bytes' do
    it 'sets the db_size_in_bytes' do
      umrc = Carto::UsersMetadataRedisCache.new
      umrc.set_db_size_in_bytes(user_mock)
      umrc.db_size_in_bytes(user_mock).should == user_mock.db_size_in_bytes
    end
  end
end
