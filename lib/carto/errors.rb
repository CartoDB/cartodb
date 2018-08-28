module Carto
  class CartoError < StandardError
    attr_reader :message, :status, :user_message, :errors_cause

    def initialize(message, status, user_message: message, errors_cause: nil)
      @message = message
      @status = status
      @user_message = user_message
      @errors_cause = errors_cause
    end

    def self.with_full_messages(active_record_exception)
      new(active_record_exception.record.errors.full_messages.join(', '))
    end
  end

  class OrderParamInvalidError < CartoError
    def initialize(valid_values)
      super("Wrong 'order' parameter value. Valid values are one of #{valid_values}", 400)
    end
  end

  class UUIDParameterFormatError < CartoError
    def initialize(parameter:, value:, status: 400)
      super("Parameter not UUID format. Parameter: #{parameter}. Value: #{value}", status)
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

  class MissingParamsError < CartoError
    def initialize(missing_params, status: 400)
      super("The following required params are missing: #{missing_params.join(', ')}", status)
    end
  end
end
