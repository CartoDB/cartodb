# encoding: utf-8

require 'typhoeus'
require 'addressable/uri'
require_relative '../../../../lib/url_signer'

module Carto
  module Gme

    # The responsibility of this class is to perform requests to gme
    # taking care of sigining requests, usage limits, errors, retries, etc.
    class Client

      BASE_URL = 'https://maps.googleapis.com'

      def initialize(client_id, private_key)
        @client_id = client_id
        @url_signer = UrlSigner.new(private_key)
      end

      def get(endpoint, params)
        url = generate_auth_url(BASE_URL+endpoint, params)
        resp = Typhoeus.get(url)
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
