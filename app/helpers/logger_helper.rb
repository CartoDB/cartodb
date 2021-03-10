require 'active_support/concern'

module LoggerHelper

  extend ActiveSupport::Concern

  def log_info(params = {})
    Rails.logger.info(log_context.merge(params))
  end

  def log_warning(params = {})
    Rails.logger.warn(log_context.merge(params))
  end

  def log_error(params = {})
    Rails.logger.error(log_context.merge(params))
  end

  private

  # Can be overriden in more specific contexts to add additional information.
  # Example: current_user and request_id in a controller
  def log_context
    {}.with_indifferent_access
  end

end
