# encoding utf-8

require 'singleton'

module Hubspot
  class EventsAPI
    include Singleton

    def report_event(id, params: {})
      return unless enabled?

      uri = URI("#{base_url}/v1/event")
      uri.query = URI.encode_www_form(params.merge(_a: token, _n: id))

      http = Net::HTTP.new(uri.host, uri.port)
      response = http.request_get(uri.request_uri)

      [response.code, response.body]
    end

    def enabled?
      token.present? && base_url.present?
    end

    private

    def serialize_params(params)
      parse_params_array = params.keys.map do |key|
        "#{key}=#{params[key]}"
      end

      parse_params_array.join('&')
    end

    def base_url
      @base_url ||= Cartodb.get_config(:metrics, 'hubspot', 'events_host')
    end

    def token
      @token ||= Cartodb.get_config(:metrics, 'hubspot', 'token')
    end
  end
end
