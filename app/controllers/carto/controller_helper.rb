require_dependency 'carto/uuidhelper'

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
      errors_cause = error.errors_cause

      respond_to do |format|
        format.html { render text: message, status: status }
        format.json { render json: { errors: message, errors_cause: errors_cause }, status: status }
      end
    end

    def rescue_from_protected_visualization_load_error(error)
      message = error.message
      status = error.status

      respond_to do |format|
        format.html { render text: message, status: status }
        format.json {
          errors_cause = error.errors_cause

          visualization = error.visualization
          visualization_info = {
            privacy: visualization.privacy,
            user: {
              google_maps_query_string: visualization.user.google_maps_query_string
            }
          }
          render json: { errors: message, errors_cause: errors_cause, visualization: visualization_info },
                 status: status
        }
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
      render_jsonp({ errors: exception.record.errors.messages }, 422)
    end

    def rescue_from_record_not_found
      render_jsonp({ errors: 'Record not found' }, 404)
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
