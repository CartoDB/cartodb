require 'uri'
require 'resolv'
require 'ipaddr'

module Carto
  module UrlValidator
    DEFAULT_URL_VALID_PORTS = [21, 80, 443].freeze

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

      (uri.is_a?(URI::HTTP) || uri.is_a?(URI::FTP)) &&
        valid_ports.include?(uri.port) &&
        !blacklisted_ip?(uri)
    rescue URI::InvalidURIError
      return false
    end

    def blacklisted_ip?(uri)
      # The uri includes regularly a hostname and is not directly the IP address
      # so we need to resolve it to compare it with the IP blacklist
      return false if blacklisted_ip_ranges.empty?

      begin
        uri_ip = IPAddr.new(Resolv.getaddress(uri.host))
      rescue Resolv::ResolvError, Resolv::ResolvTimeout
        return false
      rescue IPAddr::AddressFamilyError, IPAddr::InvalidAddressError
        raise InvalidUrlError, str
      end

      blacklisted_ip_ranges.any? { |ip_range| ip_range.include?(uri_ip) }
    end

    def blacklisted_ip_ranges
      @blacklisted_ip_ranges ||= (::Cartodb.get_config(:importer, 'blacklisted_ip_addr') || [])
        .map { |ip| IPAddr.new(ip) }
    end
  end
end
