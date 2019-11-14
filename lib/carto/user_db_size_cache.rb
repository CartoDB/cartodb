module Carto
  class UserDbSizeCache

    DB_SIZE_IN_BYTES_EXPIRATION = 2.days

    UPDATE_PROPAGATION_THRESHOLD = 8.hours

    BATCH_SIZE = 100

    def initialize(redis_cache = $users_metadata)
      @redis = redis_cache
    end

    def update_if_old(user)
      if last_updated(user) > UPDATE_PROPAGATION_THRESHOLD
        set_db_size_in_bytes(user)
      end
    end

    def db_size_in_bytes(user)
      @redis.get(db_size_in_bytes_key(user.username)).to_i
    end

    def db_size_in_bytes_change_users
      keys = @redis.scan_each(match: db_size_in_bytes_key('*')).to_a.uniq

      db_size_in_bytes_change_users = {}

      keys.each_slice(BATCH_SIZE) do |key_batch|
        usernames = key_batch.map { |key| extract_username_from_key(key) }
        db_size_in_bytes_change_users.merge!(Hash[usernames.zip(@redis.mget(key_batch).map(&:to_i))])
      end

      db_size_in_bytes_change_users
    end

    private

    def last_updated(user)
      DB_SIZE_IN_BYTES_EXPIRATION - @redis.ttl(db_size_in_bytes_key(user.username))
    end

    def set_db_size_in_bytes(user)
      @redis.setex(db_size_in_bytes_key(user.username), DB_SIZE_IN_BYTES_EXPIRATION.to_i, user.db_size_in_bytes)
    end

    def db_size_in_bytes_key(username)
      "rails:users:#{username}:db_size_in_bytes"
    end

    def extract_username_from_key(key)
      /#{db_size_in_bytes_key('(.*)')}/.match(key)[1]
    end
  end
end
