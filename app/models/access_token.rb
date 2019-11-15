class AccessToken < OauthToken

  def before_create
    self.authorized_at = Time.now
    self.created_at = Time.now
    super
  end

  def before_save
    self.updated_at = Time.now
    super
  end

  def after_create
    store_api_credentials
  end
  
  def after_destroy
    $api_credentials.del metadata_key
    super
  end
  
  def store_api_credentials
    $api_credentials.hset metadata_key, "consumer_key", client_application.key
    $api_credentials.hset metadata_key, "consumer_secret", client_application.secret
    $api_credentials.hset metadata_key, "access_token_token", token
    $api_credentials.hset metadata_key, "access_token_secret", secret
    $api_credentials.hset metadata_key, "user_id", user_id
    $api_credentials.hset metadata_key, "time", authorized_at
  end
  
  private
  
  def metadata_key
    "rails:oauth_access_tokens:#{token}"
  end
  
end
