module Carto
  class GCloudUserSettings

    REDIS_PREFIX = 'do_settings'

    STORE_ATTRIBUTES = [ :service_account, :bq_public_project,
      :gcp_execution_project, :bq_project, :bq_dataset, :gcs_bucket ]

    attr_reader :service_account, :bq_public_project,
                :gcp_execution_project, :bq_project, :bq_dataset, :gcs_bucket

    def initialize(user, attributes)
      @username = user.username
      @api_key = user.api_key

      if attributes.present?
        h = attributes.symbolize_keys
        @service_account = h[:service_account]
        @bq_public_project = h[:bq_public_project]
        @gcp_execution_project = h[:gcp_execution_project]
        @bq_project = h[:bq_project]
        @bq_dataset = h[:bq_dataset]
        @gcs_bucket = h[:gcs_bucket]
      end
    end

    def store
      $users_metadata.hmset(key, *values.to_a)
    end

    def values
      {
        service_account: @service_account.to_json,
        bq_public_project: @bq_public_project,
        gcp_execution_project: @gcp_execution_project,
        bq_project: @bq_project,
        bq_dataset: @bq_dataset,
        gcs_bucket: @gcs_bucket
      }
    end

    def remove
      $users_metadata.del key
    end

    def key
      "#{REDIS_PREFIX}:#{@username}:#{@api_key}"
    end
  end
end
