# encoding: utf-8

require 'typhoeus'
require 'addressable/uri'
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

      def get(endpoint, params)
        # TODO: error mgmt, retries, throttling
        url = generate_auth_url(BASE_URL+endpoint, params)
        resp = @http_client.get(url, timeout: @read_timeout, connecttimeout: @connect_timeout)
        resp.body
      end


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
