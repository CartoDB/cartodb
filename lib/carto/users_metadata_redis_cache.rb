# encoding: utf-8

module Carto
  class UsersMetadataRedisCache

    DB_SIZE_IN_BYTES_EXPIRATION = 2.days

    UPDATE_PROPAGATION_THRESHOLD = 8.hours

    def initialize(redis_cache = $users_metadata)
      @redis = redis_cache
    end

    def update_if_old(user)
      if user.dashboard_viewed_at.nil? || user.dashboard_viewed_at < (Time.now.utc - UPDATE_PROPAGATION_THRESHOLD)
        set_db_size_in_bytes(user)
      end
    end

    def db_size_in_bytes(user)
      @redis.get(db_size_in_bytes_key(user)).to_i
    end

    private

    def set_db_size_in_bytes(user)
      @redis.setex(db_size_in_bytes_key(user), DB_SIZE_IN_BYTES_EXPIRATION.to_i, user.db_size_in_bytes)
    end

    def db_size_in_bytes_key(user)
      "rails:users:#{user.username}:db_size_in_bytes"
    end
  end
end
