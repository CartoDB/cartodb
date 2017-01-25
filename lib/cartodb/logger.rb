module CartoDB
  class Logger
    def self.log(level, exception: nil, message: nil, user: nil, **additional_data)
      # Include the call stack if not already present
      if exception.nil? && additional_data[:stack].nil?
        additional_data[:stack] = caller
      end

      if !Rollbar.configuration.enabled || Rails.env.development?
        report_error_to_console(level, exception: exception, message: message, user: user, **additional_data)
      end

      if rollbar_scope(user).log(level, exception, message, additional_data) == 'error'
        # Error reporting to Rollbar, usually caused by unserializable data in payload
        Rollbar.log('warning', nil, 'Could not report to Rollbar', stack: caller)
      end
    rescue => rollbar_exception
      # Last chance to report error
      begin
        Rollbar.error(rollbar_exception)
      rescue
      end
    end

    def self.critical(exception: nil, message: nil, user: nil, **additional_data)
      log('critical', exception: exception, message: message, user: user, **additional_data)
    end

    def self.error(exception: nil, message: nil, user: nil, **additional_data)
      log('error', exception: exception, message: message, user: user, **additional_data)
    end

    def self.warning(exception: nil, message: nil, user: nil, **additional_data)
      log('warning', exception: exception, message: message, user: user, **additional_data)
    end

    def self.info(exception: nil, message: nil, user: nil, **additional_data)
      log('info', exception: exception, message: message, user: user, **additional_data)
    end

    def self.debug(exception: nil, message: nil, user: nil, **additional_data)
      log('debug', exception: exception, message: message, user: user, **additional_data)
    end

    # Private

    # Creates a Rollbar scope that replaces the auto-detected person with the user passed as parameter
    def self.rollbar_scope(user)
      scope = user.respond_to?(:id) ? { person: user } : nil
      Rollbar.scope(scope)
    end
    private_class_method :rollbar_scope

    def self.report_error_to_console(level, exception: nil, message: nil, user: nil, **additional_data)
      error_msg = "#{level}: #{message}\n"
      unless exception.nil?
        error_msg += exception.inspect + "\n"
        error_msg += exception.backtrace.join("\n") + "\n"
      end
      unless user.nil?
        error_msg += "user: #{user.inspect}\n"
      end
      additional_data.each do |k, v|
        error_msg += "#{k}: #{v}\n"
      end

      rails_level = level == 'warning' ? :warn : level.to_sym
      Rails.logger.send(rails_level, error_msg)
    end
    private_class_method :report_error_to_console
  end

  # Deprecated logging
  class StdoutLogger
    def self.info(title = "CARTO Log", message)
      Rails.logger.info "[#{title}] === #{message}"
    end
  end
end
