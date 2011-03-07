# coding: UTF-8

class APIKey < Sequel::Model(:api_keys)

  def validate
    super
    errors.add(:domain, 'has an invalid format') if !domain || domain.empty? || domain !~ /^http:\/\/[0-9a-z]+/i
  end

  def before_create
    self.api_key = User.secure_digest(self.domain)
    super
  end

  def user
    User[:id => user_id]
  end

end