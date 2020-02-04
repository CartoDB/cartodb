module Carto
  class GCloudUserSettings

    REDIS_PREFIX = 'do_settings'

    REDIS_KEYS = %i(service_account bq_public_project
                    gcp_execution_project bq_project bq_dataset
                    gcs_bucket).freeze

    def initialize(user, attributes)
      @username = user.username
      @api_key = user.api_key
      @attributes = attributes
    end

    def update
      if @attributes.present?
        store
      else
        remove
      end
    end

    private

    def store
      $users_metadata.hmset(key, *values.to_a)
    end

    def values
      attributes = @attributes.symbolize_keys
      redis_values = attributes.slice(*REDIS_KEYS)
      redis_values.merge(service_account: attributes[:service_account].to_json)
    end

    def remove
      $users_metadata.del key
    end

    def key
      "#{REDIS_PREFIX}:#{@username}:#{@api_key}"
    end
  end
end
