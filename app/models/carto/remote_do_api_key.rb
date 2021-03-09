module Carto
  class RemoteDoApiKey

    attr_accessor :token, :type, :username
    attr_reader :redis_client

    def initialize(attributes = {})
      attributes = attributes.with_indifferent_access
      @token = attributes[:token]
      @username = attributes[:username]
      @type = attributes[:type]
      @redis_client = $users_metadata
    end

    def save!
      redis_client.hmset(redis_key, redis_hash_as_array)
    end

    def destroy!
      redis_client.del(redis_key)
    end

    private

    def redis_key
      "#{Carto::ApiKey::REDIS_KEY_PREFIX}#{username}:#{token}"
    end

    def redis_hash_as_array
      ['user', username, 'type', type]
    end

  end
end
