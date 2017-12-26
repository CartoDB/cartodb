require_dependency 'dummy_password_generator'

class GooglePlusAPIUserData
  include DummyPasswordGenerator

  def initialize(parsed_response)
    @parsed_response = parsed_response
  end

  def email
    @parsed_response['emails'].select { |mail| mail['type'] == 'account' }.first['value']
  rescue
    nil
  end

  def auto_username
    email.nil? ? nil : email.split('@')[0]
  end

  def id
    @parsed_response['id']
  end

  def set_values(user)
    user.username = auto_username
    user.email = email
    dummy_password = generate_dummy_password
    user.password = dummy_password
    user.password_confirmation = dummy_password
    user.google_sign_in = true
  end

end

