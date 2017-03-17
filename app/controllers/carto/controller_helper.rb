require_dependency 'carto/uuidhelper'

module Carto
  class CartoError < StandardError
    attr_reader :message, :status, :user_message

    def initialize(message, status, user_message = message)
      @message = message
      @status = status
      @user_message = user_message
    end

    def self.with_full_messages(active_record_exception)
      new(active_record_exception.record.errors.full_messages.join(', '))
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

  class LoadError < CartoError
    def initialize(message, status = 404)
      super(message, status)
    end
  end

  class UnprocesableEntityError < CartoError
    def initialize(message, status = 422)
      super(message, status)
    end
  end

  module ControllerHelper
    include Carto::UUIDHelper

    def uuid_parameter(parameter)
      param = params[parameter]
      if is_uuid?(param)
        param
      else
        raise Carto::UUIDParameterFormatError.new(parameter: parameter, value: param)
      end
    end

    def rescue_from_carto_error(error)
      message = error.message
      status = error.status

      respond_to do |format|
        format.html { render text: message, status: status }
        format.json { render json: { errors: message }, status: status }
      end
    end

    def rescue_from_standard_error(error)
      CartoDB::Logger.error(exception: error)
      message = error.message
      respond_to do |format|
        format.html { render text: message, status: 500 }
        format.json { render json: { errors: message }, status: 500 }
      end
    end

    def rescue_from_validation_error(exception)
      respond_to do |format|
        format.html { render text: exception.record.errors.messages, status: 422 }
        format.json { render json: { errors: exception.record.errors.messages }, status: 422 }
      end
    end

    def rescue_from_record_not_found
      respond_to do |format|
        format.html { render_404 }
        format.json { render json: { errors: 'Record not found' }, status: 404 }
      end
    end
  end

  module DefaultRescueFroms
    def setup_default_rescues
      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from CartoError, with: :rescue_from_carto_error
      rescue_from ActiveRecord::RecordNotFound, with: :rescue_from_record_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_validation_error
    end
  end
end
