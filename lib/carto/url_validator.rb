require 'uri'

module Carto
  module UrlValidator

    class InvalidUrlError < StandardError
      def initialize(msg="Invalid URL, cannot connect dataset.")
        super
      end
    end

    def validate_url!(str)
      raise InvalidUrlError unless valid_url?(str)
    end

    private

    def valid_url?(str)
      uri = URI.parse(str)
      if uri.kind_of?(URI::HTTP) && (uri.port == 80 || uri.port == 443)
        return true
      else
        return false
      end
    rescue URI::InvalidURIError
      return false
    end

  end
end
