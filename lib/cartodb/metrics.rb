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
        Rollbar.report_message("Failed import", "error", error_info: payload)
      when :geocoding
        # Geocoding failed
        @hubspot.track_geocoding_failed(payload)
        Rollbar.report_message("Failed geocoding", "error", error_info: payload)
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

  end
end
