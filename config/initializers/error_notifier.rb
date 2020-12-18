require 'rollbar/rails'

Rollbar.configure do |config|
  config.access_token = Cartodb.config[:rollbar_api_key]
  config.enabled = (Rails.env.production? || Rails.env.staging?) && config.access_token.present?
  config.net_retries = 1 # This is actually 6 requests (18s), as Rollbar retries two times (failsafes) and CartoDB once

  # Avoid a loop between our logger (who sends errors through rollbar)
  # and rollbar itself when it cannot send an error to rollbar service
  config.logger = Logger.new($stderr)

  # Add exception class names to the exception_level_filters hash to
  # change the level that exception is reported at. Note that if an exception
  # has already been reported and logged the level will need to be changed
  # via the rollbar interface.
  # Valid levels: 'critical', 'error', 'warning', 'info', 'debug', 'ignore'
  # 'ignore' will cause the exception to not be reported at all.
  info_errors = ['error creating usertable']

  # TODO: This approach is currently not working (I suspect the usage of rescue_from StandardError)
  config.exception_level_filters.merge!(
    'ActionController::RoutingError' => 'ignore',
    'Sequel::DatabaseConnectionError' => 'warning',
    'ActiveRecord::RecordInvalid' => lambda do
      |error| info_errors.any? { |message| error.to_s.downcase.include?(message) } ? 'info' : 'error'
    end
  )

  config.before_process << proc do |options|
    raise Rollbar::Ignore if options.is_a?(Hash) && (
      options[:message]&.include?('ActionController::RoutingError') ||
      options[:message] == 'coverage failed to store'
    )
  end
end

# TODO: remove this wrapper for legacy logger
module CartoDB

  extend ::LoggerHelper

  def self.notify_exception(e, extra = {})
    log_error(exception: e, **extra)
  end

  def self.notify_error(message, additional_data = {})
    log_error(message: message, **additional_data)
  end

  # Add `:request` and `:user` to additional_data if you want request content
  def self.report_exception(e, message = nil, additional_data = {})
    log_error(exception: e, message: message, **additional_data)
  end

  def self.notify_debug(message, additional_data = {})
    log_debug(message: message, **additional_data)
  end

  def self.notify_warning_exception(exception)
    log_warning(exception: exception)
  end
end
