require 'active_support/concern'

module LoggerHelper

  extend ActiveSupport::Concern

  def log_debug(params = {})
    rails_log(:debug, params)
  end

  def log_info(params = {})
    rails_log(:info, params)
  end

  def log_warning(params = {})
    rails_log(:warn, params)
  end

  def log_error(params = {})
    rails_log(:error, params)
    send_exception_to_rollbar(params)
  end

  def log_fatal(params = {})
    rails_log(:fatal, params)
    send_exception_to_rollbar(params)
  end

  private

  def rails_log(level, params)
    parsed_params = {}.with_indifferent_access

    params.each do |key, value|
      if value.is_a?(Exception)
        parsed_params[:exception] = { class: value.class.name, message: value.message, backtrace_hint: value.backtrace&.take(5) }
        parsed_params[:message] = value.message if params[:message].blank?
      elsif value.is_a?(::User) || value.is_a?(::Carto::User)
        parsed_params[key] = value.username
      elsif value.is_a?(Carto::Organization)
        parsed_params[key] = value.name
      else
        parsed_params[key] = value
      end
    end

    Rails.logger.send(level, log_context.merge(parsed_params))
  end

  def send_exception_to_rollbar(params)
    exception = params[:exception]
    message = params[:message]

    if message && exception && exception.is_a?(Exception)
      Rollbar.error(exception, message)
    else
      Rollbar.error(exception || message)
    end
  end

  # Can be overriden in more specific contexts to add additional information.
  # Example: current_user and request_id in a controller
  def log_context
    {}.with_indifferent_access
  end

end
