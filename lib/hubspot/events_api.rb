# encoding utf-8

require 'singleton'

module Hubspot
  class EventsAPI
    include Singleton

    def report_event(id, params: {})
      return unless enabled?

      url = url(params.merge(_a: token, _n: id))

      request = Net::HTTP::Get.new(url.to_s)
      Net::HTTP.start(url.host, url.port) do |http|
        http.request(request)
      end
    end

    def enabled?
      token && base_url
    end

    private

    def serialize_params(params)
      parse_params_array = params.keys.map do |key|
        "#{key}=#{params[key]}"
      end

      parse_params_array.join('&')
    end

    def url(params)
      URI.parse("#{base_url}/v1/event?#{serialize_params(params)}")
    end

    def base_url
      @base_url ||= Cartodb.get_config(:metrics, 'hubspot', 'events_host')
    end

    def token
      @token ||= Cartodb.get_config(:metrics, 'hubspot', 'token')
    end
  end
end
