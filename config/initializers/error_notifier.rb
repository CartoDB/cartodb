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
  def self.notify_exception(e, extra={})
    user = extra.delete(:user)
    request = extra.delete(:request)
    backtrace = e.backtrace ? e.backtrace : ['']
    ::Logger.new(STDOUT).error (e.message + "\n " + backtrace.join("\n ")) if Rails.env.development? || Rails.env.test?
    Rollbar.report_exception(e, request, user)
  rescue
    # If Rollbar fails, bubble up the exception
    raise e
  end

  def self.notify_error(message, additional_data={})
    Rollbar.report_message(message, 'error', additional_data)
  end

  def self.notify_warning_exception(exception)
    Rollbar.report_exception(exception, nil, nil, 'warning')
  end

end
