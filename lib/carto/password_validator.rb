# encoding: utf-8

require_relative 'common_passwords'
require_relative 'strong_password_validator'

module Carto
  class PasswordValidator
    include Carto::CommonPasswords

    def initialize(attrs = {})
      @strong_password_validator = StrongPasswordValidator.new(attrs)
    end

    def validate(password, user = nil)
      password = '' if password.nil?

      errors = []

      if COMMON_PASSWORDS.include?(password)
        errors << "must use a different password"
      end

      if user && user.username.casecmp(password).zero?
        errors << "must be different than the user name"
      end

      errors += @strong_password_validator.validate(password)

      errors
    end

    def formatted_error_message(errors)
      return nil if errors.empty?
      return errors.first if errors.size == 1

      message = errors.first(errors.size - 1).join(', ')
      message << " and #{errors.last}"

      message
    end
  end
end
