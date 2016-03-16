require 'rollbar/rails'
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
  # Extra can contain `:request` and `:user`
  # Deprecated because of that `extra` content limitation. Use `log` instead.
  def self.notify_exception(e, extra = {})
    log('error', exception: e, **extra)
  end

  # Deprecated, use `log`
  def self.notify_error(message, additional_data = {})
    log('error', message: message, **additional_data)
  end

  # Add `:request` and `:user` to additional_data if you want request content
  # Deprecated, use `log`
  def self.report_exception(e, message = nil, additional_data = {})
    log('error', exception: e, message: message, **additional_data)
  end

  # Deprecated, use `log`
  def self.notify_debug(message, additional_data = {})
    log('debug', message: message, **additional_data)
  end

  # Deprecated, use `log`
  def self.notify_warning_exception(exception)
    log('warning', exception: exception)
  end

  def self.log(level, exception: nil, message: nil, user: nil, **additional_data)
    # Include the call stack if not already present
    if exception.nil? && additional_data[:stack].nil?
      additional_data[:stack] = caller
    end

    if Rails.env.development?
      report_error_to_console(level, exception: exception, message: message, user: user, **additional_data)
    end

    if rollbar_scope(user).log(level, exception, message, additional_data) == 'error'
      # Error reporting to Rollbar, usually caused by unserializable data in payload
      Rollbar.log('warning', nil, 'Could not report to Rollbar', stack: caller)
    end
  end

  # Private
  # Creates a Rollbar scope that replaces the auto-detected person with the user passed as parameter
  def self.rollbar_scope(user)
    scope = {}
    scope['person'] = user.respond_to?(:id)
    if !user.nil? && user.respond_to?(:id)
      scope['person'] = user
    end
    Rollbar.scope(scope)
  end
  private_class_method :rollbar_scope

  def self.report_error_to_console(level, exception: nil, message: nil, user: nil, **additional_data)
    error_msg = "#{level}: #{message}\n"
    unless exception.nil?
      error_msg += exception.inspect + "\n"
      error_msg += exception.backtrace.inspect + "\n"
    end
    unless user.nil?
      error_msg += user.inspect + "\n"
    end
    error_msg += additional_data.inspect + "\n"

    ::Logger.new(STDOUT).error(error_msg)
  end
  private_class_method :report_error_to_console
end
