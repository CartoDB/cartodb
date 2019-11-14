require_dependency 'carto/base_password_strategy'

module Carto
  class StandardPasswordStrategy < BasePasswordStrategy

    MIN_PASSWORD_LENGTH = 6
    MAX_PASSWORD_LENGTH = 64

    def validate(password, password_confirmation, user = nil)
      errors = super(password, password_confirmation, user)
      return errors if password.nil?

      errors << "must be at least #{MIN_PASSWORD_LENGTH} characters long" if password.length < MIN_PASSWORD_LENGTH
      errors << "must be at most #{MAX_PASSWORD_LENGTH} characters long" if password.length >= MAX_PASSWORD_LENGTH

      errors
    end
  end
end
