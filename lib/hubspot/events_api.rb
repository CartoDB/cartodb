# encoding: utf-8

require 'singleton'

module Hubspot
  class EventsAPI
    include Singleton

    def report(id, params: {})
      return unless enabled?

      uri = URI("#{base_url}/v1/event")
      uri.query = URI.encode_www_form({ _a: token, _n: id }.merge(params))

      http = Net::HTTP.new(uri.host, uri.port)
      response = http.request_get(uri.request_uri)

      [response.code, response.body]
    end

    def enabled?
      token.present? && base_url.present?
    end

    private

    def base_url
      @base_url ||= Cartodb.get_config(:metrics, 'hubspot', 'events_host')
    end

    def token
      @token ||= Cartodb.get_config(:metrics, 'hubspot', 'token')
    end
  end
end
