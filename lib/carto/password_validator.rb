# encoding: utf-8

require_relative 'common_passwords'
require_relative 'strong_password_validator'

module Carto
  class PasswordValidator
    include Carto::CommonPasswords

    def initialize(strong_password_validator = nil)
      @strong_password_validator = strong_password_validator
    end

    def validate(password, user = nil)
      password = '' if password.nil?

      errors = []

      if COMMON_PASSWORDS.include?(password)
        errors << "must use a different password"
      end

      if user
        if user.username.casecmp(password).zero?
          errors << "must be different than the user name"
        end

        if !@strong_password_validator && user.organization_user? && user.organization.strong_passwords_enabled
          @strong_password_validator = StrongPasswordValidator.new
        end
      end

      errors += @strong_password_validator.validate(password) if @strong_password_validator

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
