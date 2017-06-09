require 'base64'
require 'openssl'

module Carto
  class GoogleMapsApiSigner
    def initialize(signature_key)
      @key = signature_key
    end

    def sign(url)
      binary_signature = hmac(uri_path_and_query(url))
      signature = Base64.urlsafe_encode64(binary_signature)

      "#{url}&signature=#{signature}"
    end

    private

    def uri_path_and_query(url)
      uri = URI.parse(url)
      uri.path + '?' + uri.query
    end

    def hmac(data)
      OpenSSL::HMAC.digest(OpenSSL::Digest.new('sha1'), binary_key, data)
    end

    def binary_key
      Base64.urlsafe_decode64(@key)
    end
  end
end
