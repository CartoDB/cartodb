require 'mixpanel'
require 'json'
require 'rollbar'

module CartoDB
  class Metrics
    def report(event, payload)
      return self unless event.present?
      if payload.fetch(:success, false)
        report_success(event, payload)
      else
        report_failure(event, payload)
      end
    rescue => exception
      self
    end #report

    def mixpanel_payload(event, metric_payload)
      return nil unless event.present?
      #remove the log from the payload
      payload = metric_payload.select {|k,v| k != :log }
      Hash[payload.map{ |key,value|
        [(["username","account_type", "distinct_id"].include?(key.to_s) ?
            key.to_s : "#{ event }_" + key.to_s),
          value]
        }].symbolize_keys
    end

    def report_failure(event, metric_payload)
      case event
      when :import
        mixpanel_event("Import failed", mixpanel_payload(event, metric_payload))
        Rollbar.report_message("Failed import", "error", error_info: metric_payload)
      when :geocoding
        mixpanel_event("Geocoding failed", mixpanel_payload(event, metric_payload))
        Rollbar.report_message("Failed geocoding", "error", error_info: metric_payload)
      end
    end #report_failure

    def report_success(event, metric_payload)
      case event
      when :import
        mixpanel_event("Import successful", mixpanel_payload(event, metric_payload))
      when :geocoding
        mixpanel_event("Geocoding successful", mixpanel_payload(event, metric_payload))
      end
    end #report_success

    def mixpanel_event(*args)
      return self unless Cartodb.config[:mixpanel].present?
      token = Cartodb.config[:mixpanel]['token']
      Mixpanel::Tracker.new(token).send(:track, *args)
    rescue => exception
      Rollbar.report_message(
        "Failed to send metric to Mixpanel",
        "error",
        error_info: args.join('-')
      )
      self
    end #mixpanel_event

  end
end

