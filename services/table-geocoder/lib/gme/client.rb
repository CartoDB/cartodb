# encoding: utf-8

require 'addressable/uri'
require 'set'
require_relative '../../../../lib/url_signer'
require_relative '../../../../lib/carto/http/client'

module Carto
  module Gme

    # The responsibility of this class is to perform requests to gme
    # taking care of sigining requests, usage limits, errors, retries, etc.
    class Client

      BASE_URL = 'https://maps.googleapis.com'

      DEFAULT_CONNECT_TIMEOUT = 45
      DEFAULT_READ_TIMEOUT = 60
      DEFAULT_RETRY_TIMEOUT = 60

      HTTP_CLIENT_TAG = 'gme_client'

      RETRIABLE_STATUSES = Set.new [500, 503, 504]

      class Timeout < StandardError; end;

      # Performs requests to Google Maps API web services
      # Based on https://github.com/googlemaps/google-maps-services-python/blob/master/googlemaps/client.py
      def initialize(client_id, private_key, options = {})
        @client_id = client_id
        @url_signer = UrlSigner.new(private_key)
        @connect_timeout = options[:connect_timeout] || DEFAULT_CONNECT_TIMEOUT
        @read_timeout = options[:read_timeout] || DEFAULT_READ_TIMEOUT
        @retry_timeout = options[:retry_timeout] || DEFAULT_RETRY_TIMEOUT
        @http_client = Carto::Http::Client.get(HTTP_CLIENT_TAG)
      end

      def get(endpoint, params, first_request_time=nil, retry_counter=0)
        first_request_time ||= Time.now
        elapsed = Time.now - first_request_time
        if elapsed > @retry_timeout
          raise Timeout.new
        end

        if retry_counter > 0
          delay_seconds = 0.5 * 1.5 ** (retry_counter - 1)
          sleep delay_seconds
        end

        url = generate_auth_url(BASE_URL+endpoint, params)

        resp = @http_client.get(url, timeout: @read_timeout, connecttimeout: @connect_timeout)
        raise Timeout.new if resp.timed_out?

        if RETRIABLE_STATUSES.include?(resp.code)
          return self.get(endpoint, params, first_request_time, retry_counter+1)
        end

        resp.body
      end

      # TODO: implement method get_body instead of returning resp.body directly, check there OVER_QUERY_LIMIT


      private

      def generate_auth_url(path, params)
        uri = Addressable::URI.new
        uri.path = path
        uri.query_values = params.merge(client: @client_id)
        @url_signer.sign_url(uri.request_uri)
      end

    end

  end
end
