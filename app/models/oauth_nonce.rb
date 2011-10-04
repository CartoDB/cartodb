# TODO: remove
class OauthNonce < Sequel::Model

  # Remembers a nonce and it's associated timestamp. It returns false if it has already been used
  def self.remember(nonce, timestamp)
    oauth_nonce = OauthNonce.create(:nonce => nonce, :timestamp => timestamp)
    return false if oauth_nonce.new?
    oauth_nonce
  end

  def before_create
    self.created_at = Time.now
    super
  end

  def before_save
    self.updated_at = Time.now
    super
  end

end
