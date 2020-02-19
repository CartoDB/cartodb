require_relative 'common_passwords'

module Carto
  class BasePasswordStrategy
    include Carto::CommonPasswords

    def validate(password, password_confirmation, user = nil)
      return ["can't be blank"] if password.nil?
      errors = []
      errors << "doesn't match confirmation" if password != password_confirmation
      errors << "can't be a common password" if COMMON_PASSWORDS.include?(password)
      errors << "must be different than the user name" if user.try(:username) && user.username.casecmp(password).zero?

      errors
    end
  end
end
