# coding: UTF-8

class APIKey < Sequel::Model(:api_keys)

  def validate
    super
    domain = "http://#{domain}" if domain !~ /^http:\/\//
  end

  def before_create
    self.api_key = User.secure_digest(self.domain)
    super
  end

  def user
    User[:id => user_id]
  end

end