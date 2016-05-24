require 'rollbar/rails'
require 'cartodb/logger'
Rollbar.configure do |config|
  config.access_token = Cartodb.config[:rollbar_api_key]
  config.enabled = (Rails.env.production? || Rails.env.staging?) && config.access_token.present?
  config.net_retries = 1 # This is actually 6 requests (18s), as Rollbar retries two times (failsafes) and CartoDB once

  # Add exception class names to the exception_level_filters hash to
  # change the level that exception is reported at. Note that if an exception
  # has already been reported and logged the level will need to be changed
  # via the rollbar interface.
  # Valid levels: 'critical', 'error', 'warning', 'info', 'debug', 'ignore'
  # 'ignore' will cause the exception to not be reported at all.
  config.exception_level_filters.merge!(
    'ActionController::RoutingError' => 'ignore'
  )
end

module CartoDB
  # Old, deprecated, logging functions
  # Use the new logging module in lib/cartodb/logger.rb

  # Extra can contain `:request` and `:user`
  # Deprecated because of that `extra` content limitation. Use `report_exception` instead.
  def self.notify_exception(e, extra = {})
    CartoDB::Logger.log('error', exception: e, **extra)
  end

  def self.notify_error(message, additional_data = {})
    CartoDB::Logger.log('error', message: message, **additional_data)
  end

  # Add `:request` and `:user` to additional_data if you want request content
  def self.report_exception(e, message = nil, additional_data = {})
    CartoDB::Logger.log('error', exception: e, message: message, **additional_data)
  end

  def self.notify_debug(message, additional_data = {})
    CartoDB::Logger.log('debug', message: message, **additional_data)
  end

  def self.notify_warning_exception(exception)
    CartoDB::Logger.log('warning', exception: exception)
  end
end
