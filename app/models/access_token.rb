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

end
