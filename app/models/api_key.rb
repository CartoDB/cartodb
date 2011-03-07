# coding: UTF-8

class APIKey < Sequel::Model(:api_keys)

  def before_validation
    self.domain = "http://#{domain}" if domain !~ /^http:\/\// && !domain.blank?
    super
  end

  def validate
    super
    errors.add(:domain, "cannot be blank") if domain.blank?
    errors.add(:domain, "already taken") if APIKey.filter(:domain => domain, :user_id => self.user_id).count > 0
  end

  def before_create
    self.api_key = User.secure_digest(self.domain)
    super
  end

  def user
    User[:id => user_id]
  end

end