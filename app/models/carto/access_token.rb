module Carto
  class AccessToken < OauthToken

    # Compatibility with ActiveRecord inheritance. When migrating to ActiveRecord,
    # the class name changed from ::AccessToken to ::Carto::AccessToken
    # Source: https://yiming.dev/blog/2017/12/07/add-sti-to-a-legacy-activerecord-model/
    self.store_full_sti_class = false

    before_create :set_authorized_at
    after_create :store_api_credentials
    after_destroy :clear_api_credentials

    private

    def metadata_key
      "rails:oauth_access_tokens:#{token}"
    end

    def set_authorized_at
      self.authorized_at = Time.now
    end

    def store_api_credentials
      $api_credentials.hset metadata_key, "consumer_key", client_application.key
      $api_credentials.hset metadata_key, "consumer_secret", client_application.secret
      $api_credentials.hset metadata_key, "access_token_token", token
      $api_credentials.hset metadata_key, "access_token_secret", secret
      $api_credentials.hset metadata_key, "user_id", user_id
      $api_credentials.hset metadata_key, "time", authorized_at
    end

    def clear_api_credentials
      $api_credentials.del metadata_key
    end

  end
end
