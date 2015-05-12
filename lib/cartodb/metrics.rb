require 'typhoeus'
require 'rollbar'

# Development info: http://developers.hubspot.com/docs/overview
module CartoDB
  class Metrics

    def initialize
      @events_host = Cartodb.config[:hubspot]['events_host']
      @api_key = Cartodb.config[:hubspot]['api_key']
    end

    def enabled?
      !@api_key.nil?
    end

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

    def report_failure(event, payload)
      case event
      when :import
        # Import failed
        track_event("000000273115", payload)
        Rollbar.report_message("Failed import", "error", error_info: payload)
      when :geocoding
        # Geocoding failed
        track_event("000000273116", payload)
        Rollbar.report_message("Failed geocoding", "error", error_info: payload)
      end
    end #report_failure

    def report_success(event, payload)
      case event
      when :import
        # Import successful
        track_event("000000273111", payload)
      when :geocoding
        # Geocoding successful
        track_event("000000273112", payload)
      end
    end #report_success

    def track_event(event_id, payload)
      return self unless enabled?

      response = get_events("/v1/event/?_a=#{@token}&_n=#{event_id}&email=#{payload.email}")

      unless (!response.nil? && response.code == 200)
        Rollbar.report_message('Hubspot error tracking event', 'error', { payload: payload,  event: event_id })
      end

      self
    end

    private

      def get_events(endpoint, valid_response_codes = [ 200 ])
        send_request(events_url(endpoint), 'GET', nil, valid_response_codes)
      end

      def events_url(endpoint)
        "#{@events_host}#{endpoint}"
      end

      def send_request(url, method, content = nil, valid_response_codes = [ 200 ])
        response = Typhoeus::Request.new(
          url,
          method: method,
          headers: { "Content-Type" => "application/json" },
          body: content.nil? ? nil : content.to_json,
          ssl_verifypeer: true,
          timeout: 600
        ).run

        if !valid_response_codes.include?(response.code)
          raise "Hubspot error #{response.code}"
        end

        Rollbar.report_message('Hubspot', 'debug', { url: url, response: response.inspect })

        response
      rescue => e
        Rollbar.report_exception(e, nil, { url: url, content: content, reponse: response.inspect })
        nil
      end

  end
end

