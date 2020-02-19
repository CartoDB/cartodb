class OauthToken < Sequel::Model

  many_to_one :client_application
  many_to_one :user

  plugin :single_table_inheritance, :type

  def invalidated?
    invalidated_at != nil
  end

  def invalidate!
    set(:invalidated_at => Time.now)
    save_changes
  end

  def authorized?
    authorized_at != nil && !invalidated?
  end

  def to_query
    "oauth_token=#{token}&oauth_token_secret=#{secret}"
  end

  def before_create
    self.token = OAuth::Helper.generate_key(40)[0,40]
    self.secret = OAuth::Helper.generate_key(40)[0,40]
    self.created_at = Time.now
    super
  end

  def before_save
    self.updated_at = Time.now
    super
  end

end
