require 'typhoeus'
require 'rollbar'
require 'singleton'

# Development info: http://developers.hubspot.com/docs/overview
module CartoDB
  class Hubspot

    include Singleton

    attr_reader :event_ids, :token

    def initialize
      config = Cartodb.config[:hubspot]
      if config.present? && config.is_a?(Hash)
        @enabled = true
        @events_host = config.fetch('events_host')
        @api_key = config.fetch('api_key')
        @event_ids = config.fetch('event_ids')
        @token = config.fetch('token')
      else
        @enabled = false
        @event_ids = {}
      end
    end

    def enabled?
      @enabled == true
    end

    def track_import_failed(payload)
      track_event(event_ids['import_failed_id'], payload)
    end

    def track_geocoding_failed(payload)
      track_event(event_ids['geocoding_failed_id'], payload)
    end

    def track_import_success(payload)
      track_event(event_ids['import_success_id'], payload)
    end

    def track_geocoding_success(payload)
      track_event(event_ids['geocoding_success_id'], payload)
    end


    private

    def track_event(event_id, metric_payload)
      return self unless enabled?

      #remove the log from the payload
      payload = metric_payload.select {|k,v| k != :log }

      response = get_events("/v1/event/?_a=#{@token}&_n=#{event_id}&email=#{payload[:email]}")

      unless (!response.nil? && response.code == 200)
        Rollbar.report_message('Hubspot error tracking event', 'error', { payload: payload,  event: event_id })
      end

      self
    end

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

      response
    rescue => e
      Rollbar.report_exception(e, nil, { url: url, content: content, reponse: response.inspect })
      nil
    end

  end
end
