require_dependency 'carto/standard_password_strategy'

module Carto
  class PasswordValidator

    def initialize(strategy = Carto::StandardPasswordStrategy.new)
      @strategy = strategy
    end

    def validate(password, password_confirmation, user = nil)
      @strategy.validate(password, password_confirmation, user)
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
