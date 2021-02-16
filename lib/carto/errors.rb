module Carto
  class CartoError < StandardError
    attr_reader :message, :status, :user_message, :errors_cause, :headers

    def initialize(message, status, user_message: message, errors_cause: nil, headers: nil)
      @message = message
      @status = status
      @user_message = user_message
      @errors_cause = errors_cause
      @headers = headers
    end

    def self.with_full_messages(active_record_exception)
      new(active_record_exception.record.errors.full_messages.join(', '))
    end
  end

  class BadRequest < CartoError

    def initialize(message, status = 400)
      super(message, status)
    end

  end

  class ParamInvalidError < CartoError

    def initialize(parameter, valid_values = nil, status = 400)
      extra_message = valid_values ? " Valid values are one of #{valid_values}" : ''
      super("Wrong '#{parameter}' parameter value.#{extra_message}", status)
    end

  end

  class ParamCombinationInvalidError < CartoError
    def initialize(parameter, valid_values)
      super("Wrong '#{parameter}' parameter combination. Valid values to combine: #{valid_values}", 400)
    end
  end

  class UUIDParameterFormatError < CartoError
    def initialize(parameter:, value:, status: 400)
      super("Parameter not UUID format. Parameter: #{parameter}. Value: #{value}", status)
    end
  end

  class ExpiredSessionError < CartoError
    def initialize(message = "Your session has expired.", status = 401)
      super(message, status)
    end
  end

  class UnauthorizedError < CartoError
    def initialize(message = "You don't have permission to access that resource", status = 403)
      super(message, status)
    end
  end

  class PasswordConfirmationError < CartoError
    def initialize(message = "Confirmation password sent does not match your current password", status = 403)
      super(message, status)
    end
  end

  class LoadError < CartoError
    def initialize(message, status = 404, errors_cause: nil)
      super(message, status, errors_cause: errors_cause)
    end
  end

  class ProtectedVisualizationLoadError < LoadError
    def initialize(visualization)
      @visualization = visualization
      super('Visualization not viewable', 403, errors_cause: 'privacy_password')
    end

    attr_reader :visualization
  end

  class UnprocesableEntityError < CartoError
    def initialize(message, status = 422)
      super(message, status)
    end
  end

  class RelationDoesNotExistError < UnprocesableEntityError
    def initialize(error_messages, error_relations)
      super(error_messages.join(', '))
      @user_message = "#{error_relations.join(', ')} don't exist."
    end
  end

  class MissingParamsError < CartoError
    def initialize(missing_params, status = 400)
      super("The following required params are missing: #{missing_params.join(', ')}", status)
    end
  end

  class InvalidParameterFormatError < CartoError
    def initialize(parameter, extra_message = nil)
      super("Wrong '#{parameter}' parameter value. #{extra_message}", 422)
    end
  end

  class PaymentRequiredError < CartoError
    def initialize(message = "Payment Required")
      super(message, 402)
    end
  end

  class QuotaExceededError < PaymentRequiredError
    def initialize(message = "Your quota has been exceeded")
      super(message)
    end
  end
end
