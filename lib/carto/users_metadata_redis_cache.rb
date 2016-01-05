# encoding: utf-8

module Carto
  class UsersMetadataRedisCache

    # This needs to be changed whenever there're changes in the code that require invalidation of old keys
    VERSION = '1'

    DB_SIZE_IN_BYTES_EXPIRATION = 2.days

    def initialize(redis_cache = $users_metadata)
      @redis = $users_metadata
    end

    def set_db_size_in_bytes(user)
      @redis.setex(db_size_in_bytes_key(user), DB_SIZE_IN_BYTES_EXPIRATION.to_i, user.db_size_in_bytes)
    end

    def db_size_in_bytes(user)
      @redis.get(db_size_in_bytes_key(user)).to_i
    end

    private

    def db_size_in_bytes_key(user)
      "rails:users:#{user.username}:db_size_in_bytes:#{date_key}"
    end

    def date_key
      Time.now.strftime('%Y%m%d')
    end
  end
end
