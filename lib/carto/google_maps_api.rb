require 'base64'
require 'openssl'

module Carto
  class GoogleMapsApi
    def sign(user, url)
      raise 'User does not have Google configured' unless user.google_maps_query_string.present?
      if user.google_maps_client_id.present? && user.google_maps_private_key.present?
        # Add client=xxx + signature
        client_id_signed_url(user, url)
      else
        # Just add key=xxx
        key_signed_url(user, url)
      end
    end

    private

    def client_id_signed_url(user, url)
      uri = URI.parse("#{url}&#{user.google_maps_query_string}")
      payload_to_sign = uri.path + '?' + uri.query
      signature = hmac(user.google_maps_private_key, payload_to_sign)

      "#{uri}&signature=#{signature}"
    end

    def key_signed_url(user, url)
      "#{url}&#{user.google_maps_query_string}"
    end

    def hmac(key, data)
      binary_key = Base64.urlsafe_decode64(key)
      binary_signature = OpenSSL::HMAC.digest(OpenSSL::Digest.new('sha1'), binary_key, data)
      Base64.urlsafe_encode64(binary_signature)
    end
  end
end
