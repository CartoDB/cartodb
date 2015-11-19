require 'uri'

module Carto
  module UrlValidator
    DEFAULT_URL_VALID_PORTS = [80, 443]

    class InvalidUrlError < StandardError
      def initialize(url)
        super "Invalid URL, cannot connect dataset: #{url}"
      end
    end

    def validate_url!(str, valid_ports = DEFAULT_URL_VALID_PORTS)
      raise InvalidUrlError, str unless valid_url?(str, valid_ports)
    end

    private

    def valid_url?(str, valid_ports)
      uri = URI.parse(str)
      return uri.is_a?(URI::HTTP) && valid_ports.include?(uri.port)
    rescue URI::InvalidURIError
      return false
    end
  end
end
