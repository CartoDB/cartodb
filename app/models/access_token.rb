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
    base_key = "rails:oauth_access_tokens:#{token}"

    $api_credentials.hset base_key, "consumer_key", client_application.key
    $api_credentials.hset base_key, "access_token_token", token
    $api_credentials.hset base_key, "access_token_secret", secret
    $api_credentials.hset base_key, "user_id", user_id
    $api_credentials.hset base_key, "time", authorized_at
  end
  
end
