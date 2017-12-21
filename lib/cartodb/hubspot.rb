require 'rollbar'
require 'singleton'
require_relative '../carto/http/client'


# Development info: http://developers.hubspot.com/docs/overview
module CartoDB
  class Hubspot

    include Singleton

    attr_reader :event_ids, :form_ids, :token

    def initialize
      metrics = Cartodb.config[:metrics]
      if metrics.present? && metrics['hubspot'].present? && metrics['hubspot'].is_a?(Hash)
        config = metrics['hubspot']
        @enabled = true
        @events_host = config.fetch('events_host')
        @event_ids = config.fetch('event_ids')
        @form_ids = config.fetch('form_ids')
        @token = config.fetch('token')
      else
        @enabled = false
      end
    end

    def enabled?
      @enabled == true
    end

    def track_import_failed(payload)
      track_event('import_failed', payload)
    end

    def track_geocoding_failed(payload)
      track_event('geocoding_failed', payload)
    end

    def track_import_success(payload)
      track_event('import_success', payload)
    end

    def track_geocoding_success(payload)
      track_event('geocoding_success', payload)
    end


    private

    def track_event(event_name, metric_payload)
      return self unless enabled?

      event_id = event_ids[event_name]

      #remove the log from the payload
      payload = metric_payload.select {|k,v| k != :log }

      response = get_events("/v1/event/?_a=#{@token}&_n=#{event_id}&email=#{payload[:email]}")

      unless (!response.nil? && response.code == 200)
        CartoDB::Logger.error(message: 'Hubspot error tracking event', payload: payload, event_id: event_id)
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
      http_client = Carto::Http::Client.get('hubspot')
      response = http_client.request(
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
      CartoDB::Logger.error(exception: e, url: url, content: content, response: response)
      nil
    end

  end
end
