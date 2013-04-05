require 'rollbar/rails'
Rollbar.configure do |config|
  config.access_token = Cartodb.config[:rollbar_api_key]

  # Add exception class names to the exception_level_filters hash to
  # change the level that exception is reported at. Note that if an exception
  # has already been reported and logged the level will need to be changed
  # via the rollbar interface.
  # Valid levels: 'critical', 'error', 'warning', 'info', 'debug', 'ignore'
  # 'ignore' will cause the exception to not be reported at all.
  # config.exception_level_filters.merge!('MyCriticalException' => 'critical')
end

module CartoDB
  def self.notify_exception(e, user)
    Rollbar.report_message(e, "info", :user => user)
  end
end
