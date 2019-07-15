require_dependency 'carto/uuidhelper'
require_dependency 'carto/errors'

module Carto
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

    def rescue_from_central_error(error)
      CartoDB::Logger.error(exception: error,
                            message: 'Error while updating data in Central',
                            user: @user)
      render_jsonp({ errors: 'Error while updating data in Central' }, 500)
    end
  end

  module DefaultRescueFroms
    def setup_default_rescues
      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from CartoError, with: :rescue_from_carto_error
      rescue_from ActiveRecord::RecordNotFound, with: :rescue_from_record_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_validation_error
      rescue_from CartoDB::CentralCommunicationFailure, with: :rescue_from_central_error
    end
  end
end
