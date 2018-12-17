# encoding: utf-8

require_relative 'common_passwords'
require_relative 'strong_password_validator'

module Carto
  class PasswordValidator
    include Carto::CommonPasswords

    MIN_PASSWORD_LENGTH = 6
    MAX_PASSWORD_LENGTH = 64

    def initialize(strong_password_validator = nil)
      @strong_password_validator = strong_password_validator
    end

    def validate(password, password_confirmation, user = nil)
      errors = []
      if password.nil?
        errors << "can't be blank"
      else
        errors << "doesn't match confirmation" if password != password_confirmation
        unless strong_password_enabled?(user)
          errors << "must be at least #{MIN_PASSWORD_LENGTH} characters long" if password.length < MIN_PASSWORD_LENGTH
          errors << "must be at most #{MAX_PASSWORD_LENGTH} characters long" if password.length >= MAX_PASSWORD_LENGTH
        end
        errors << "can't be a common password" if COMMON_PASSWORDS.include?(password)
        errors << "must be different than the user name" if user.try(:username) && user.username.casecmp(password).zero?
        errors += strong_password_validator.validate(password) if strong_password_enabled?(user)
      end

      errors
    end

    def strong_password_enabled?(user)
      @strong_password_validator || user.organization.try(:strong_passwords_enabled)
    end

    def strong_password_validator
      @strong_password_validator ||= StrongPasswordValidator.new
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
