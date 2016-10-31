require 'rollbar'
require_relative 'hubspot'

module CartoDB
  class Metrics

    def initialize
      @hubspot = CartoDB::Hubspot.instance
    end

    def report(event, payload)
      return self unless event.present?
      if payload.fetch(:success, false)
        report_success(event, payload)
      else
        report_failure(event, payload)
      end
    end

    def report_failure(event, payload)
      case event
      when :import
        # Import failed
        @hubspot.track_import_failed(payload)
        CartoDB::Logger.log(import_error_level(payload), message: "Failed import", error_info: payload)
      when :geocoding
        # Geocoding failed
        @hubspot.track_geocoding_failed(payload)
        CartoDB::Logger.error(message: "Failed geocoding", error_info: payload)
      end
    end #report_failure

    def report_success(event, payload)
      case event
      when :import
        # Import successful
        @hubspot.track_import_success(payload)
      when :geocoding
        # Geocoding successful
        @hubspot.track_geocoding_success(payload)
      end
    end

    private

    def import_error_level(payload)
      error_code = payload.nil? ? nil : payload[:error_code]
      error_code.nil? || error_code == 99999 ? 'error' : 'debug'
    end

  end
end
