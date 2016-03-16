require 'rollbar/rails'
require 'carto/logger'
Rollbar.configure do |config|
  config.access_token = Cartodb.config[:rollbar_api_key]
  config.enabled = Rails.env.production? || Rails.env.staging?
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
  # Use the new logging module in lib/carto/logger.rb

  # Old, deprecated, logging functions

  # Extra can contain `:request` and `:user`
  # Deprecated because of that `extra` content limitation. Use `report_exception` instead.
  def self.notify_exception(e, extra = {})
    Carto::Logger.log('error', exception: e, **extra)
  end

  def self.notify_error(message, additional_data = {})
    Carto::Logger.log('error', message: message, **additional_data)
  end

  # Add `:request` and `:user` to additional_data if you want request content
  def self.report_exception(e, message = nil, additional_data = {})
    Carto::Logger.log('error', exception: e, message: message, **additional_data)
  end

  def self.notify_debug(message, additional_data = {})
    Carto::Logger.log('debug', message: message, **additional_data)
  end

  def self.notify_warning_exception(exception)
    Carto::Logger.log('warning', exception: exception)
  end
end
