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
  end

  def log_fatal(params = {})
    rails_log(:fatal, params)
  end

  private

  def rails_log(level, params)
    parsed_params = {}.with_indifferent_access

    params.each do |key, value|
      parsed_params[key] = case value
                           when ::User
                             value.username
                           when ::Carto::User
                             value.username
                           when ::Carto::Organization
                             value.name
                           else
                             value
                           end
    end

    Rails.logger.send(level, log_context.merge(parsed_params))
  end

  # Can be overriden in more specific contexts to add additional information.
  # Example: current_user and request_id in a controller
  def log_context
    {}.with_indifferent_access
  end

end
