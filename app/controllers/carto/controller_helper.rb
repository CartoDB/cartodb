require_dependency 'carto/uuidhelper'

module Carto
  class CartoError < StandardError
    attr_reader :message, :status, :user_message

    def initialize(message, status, user_message = message)
      @message = message
      @status = status
      @user_message = user_message
    end
  end

  class UUIDParameterFormatError < CartoError
    def initialize(parameter, status = 400)
      super("Parameter not UUID format: #{parameter}", status)
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
        raise Carto::UUIDParameterFormatError.new(parameter)
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
      CartoDB.report_exception(error, "Error", request: request, user: current_user)
      message = error.message
      respond_to do |format|
        format.html { render text: message, status: 500 }
        format.json { render json: { errors: message }, status: 500 }
      end
    end
  end
end
