# TODO: replace this with newer ::LoggerHelper
module CartoGearsApi
  # Logger using CARTO conventions.
  #
  # Gears on CARTO should use this class for logging. It takes local directories and external
  # services conventions into account.
  class Logger
    # @param gear_name [String] The name of the gear. Log messages will be prefixed with it.
    def initialize(gear_name)
      @gear = gear_name
    end

    # Error level trace.
    # @param exception [Exception] exception to be logged.
    # @param message [String] message to be shown. Sometimes (such as using Rollbar) log entries are grouped by message,
    #                so keep message generic and add any extra information in `additional_data` if needed.
    # @param user [CartoGearsApi::User] logged user.
    # @param additional_data [Hash] extra information to be logged
    def error(exception: nil, message: nil, user: nil, **additional_data)
      log('error', exception: exception, message: message, user: user, **additional_data)
    end

    # Info level trace.
    # @param exception [Exception] exception to be logged.
    # @param message [String] message to be shown. Sometimes (such as using Rollbar) log entries are grouped by message,
    #                so keep message generic and add any extra information in `additional_data` if needed.
    # @param user [CartoGearsApi::User] logged user.
    # @param additional_data [Hash] extra information to be logged
    def info(exception: nil, message: nil, user: nil, **additional_data)
      log('info', exception: exception, message: message, user: user, **additional_data)
    end

    # Debug level trace.
    # @param exception [Exception] exception to be logged.
    # @param message [String] message to be shown. Sometimes (such as using Rollbar) log entries are grouped by message,
    #                so keep message generic and add any extra information in `additional_data` if needed.
    # @param user [CartoGearsApi::User] logged user.
    # @param additional_data [Hash] extra information to be logged
    def debug(exception: nil, message: nil, user: nil, **additional_data)
      log('debug', exception: exception, message: message, user: user, **additional_data)
    end

    private

    def log(level, exception: nil, message: nil, user: nil, **additional_data)
      Rollbar.error(exception) if exception
      Rails.logger.send(
        level,
        exception: { class: exception&.class&.name, message: exception&.message, backtrace_hint: exception&.backtrace&.take(5) },
        gear: gear,
        message: message,
        current_user: user,
        **additional_data
      )
    end
  end
end
