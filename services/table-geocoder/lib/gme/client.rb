# encoding: utf-8

require 'addressable/uri'
require 'set'
require 'json'
require_relative 'exceptions'
require_relative '../exceptions'
require_relative '../../../../lib/url_signer'
require_relative '../../../../lib/carto/http/client'

module Carto
  module Gme

    # The responsibility of this class is to perform requests to gme
    # taking care of sigining requests, usage limits, errors, retries, etc.
    class Client

      BASE_URL = 'https://maps.googleapis.com'

      DEFAULT_CONNECT_TIMEOUT = 15
      DEFAULT_READ_TIMEOUT = 30
      DEFAULT_RETRY_TIMEOUT = 60

      OK_STATUS = 'OK'
      ZERO_RESULTS_STATUS = 'ZERO_RESULTS'
      OVERQUERY_LIMIT_STATUS = 'OVER_QUERY_LIMIT'
      REQUEST_DENIED_STATUS = 'REQUEST_DENIED'
      INVALID_REQUEST_STATUS = 'INVALID_REQUEST'
      UNKNOWN_ERROR_STATUS = 'UNKNOWN_ERROR'

      HTTP_CLIENT_TAG = 'gme_client'

      RETRIABLE_STATUSES = Set.new [500, 503, 504]

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
          raise Carto::GeocoderErrors::GmeGeocoderTimeoutError.new('retry timeout expired')
        end

        # 0.5 * (1.5 ^ i) is an increased sleep time of 1.5x per iteration,
        # starting at 0.5s when retry_counter=0. The first retry will occur
        # at 1, so subtract that first.
        if retry_counter > 0
          delay_seconds = 0.1 * 1.5 ** (retry_counter - 1)
          sleep delay_seconds
        end

        url = generate_auth_url(BASE_URL+endpoint, params)

        resp = @http_client.get(url, timeout: @read_timeout, connecttimeout: @connect_timeout)
        raise Timeout.new('http request timed out') if resp.timed_out?

        if RETRIABLE_STATUSES.include?(resp.code)
          return self.get(endpoint, params, first_request_time, retry_counter+1)
        end

        begin
          get_body(resp)
        rescue OverQueryLimit
          CartoDB.notify_debug('Carto::Gme::Client rescuing from OverQueryLimit exception', params.symbolize_keys)
          return self.get(endpoint, params, first_request_time, retry_counter+1)
        end
      end


      private

      def generate_auth_url(path, params)
        uri = Addressable::URI.new
        uri.path = path
        uri.query_values = params.merge(client: @client_id)
        @url_signer.sign_url(uri.request_uri)
      end

      # Takes a typhoeus response object and returns a hash
      def get_body(resp)
        if resp.code != 200
          # Remove temporarily from rollbar because it's flooding the logs
          if resp.code != 400
            CartoDB::Logger.warning(message: 'Error response from GME client',
                                    client_id: @client_id,
                                    code: resp.code,
                                    response_body: resp.response_body)
          end
          raise HttpError.new(resp.code)
        end

        body = JSON::parse(resp.body)

        api_status = body['status']
        if api_status == 'OK' || api_status == 'ZERO_RESULTS'
          return body
        end

        if api_status == 'OVER_QUERY_LIMIT'
          raise OverQueryLimit.new
        end

        if body.has_key?('error_message')
          raise ApiError.new(api_status, body['error_message'])
        else
          raise ApiError.new(api_status)
        end

      end

    end

  end
end
