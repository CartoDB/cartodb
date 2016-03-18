require 'yaml'

Warden::Strategies.add(:saml_header) do

  def valid?
    true
  end

  def store?
    true
  end

  def authenticate!
    user_info = SamlAuthenticator.get_user_info(params)
    user = SamlAuthenticator.check_user(user_info)
    user ? success!(user) : fail!
  end
end
