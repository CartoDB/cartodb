# coding: UTF-8

class Group < Sequel::Model

  many_to_one :organization

  def get_auth_token
    auth_token || generate_auth_token
  end

  private

  def generate_auth_token
    update(auth_token: SecureRandom.urlsafe_base64(nil, false))
    auth_token
  end

end
