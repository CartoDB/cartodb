module Carto

  class GCloudUserSettings
    REDIS_PREFIX = 'do_settings'

    REDIS_KEYS = %i(service_account bq_public_project
                    gcp_execution_project bq_project bq_dataset
                    gcs_bucket).freeze

    def initialize(user)
      @username = user.username
    end

    def update(attributes)
      if attributes.present?
        store attributes
      else
        remove
      end
    end

    def read
      Hash[REDIS_KEYS.zip($users_metadata.hmget(key, *REDIS_KEYS))]
    end

    private

    def store(attributes)
      $users_metadata.hmset(key, *values(attributes).to_a)
    end

    def values(attributes)
      attributes.symbolize_keys.slice(*REDIS_KEYS)
    end

    def remove
      $users_metadata.del(key)
    end

    def key
      "#{REDIS_PREFIX}:#{@username}"
    end
  end
end
