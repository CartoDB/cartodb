class AccessToken < OauthToken

  def before_create
    self.authorized_at = Time.now
    self.created_at = Time.now
  end

  def before_save
    self.updated_at = Time.now
  end

end
