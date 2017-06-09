require 'base64'
require 'openssl'

module Carto
  class GoogleMapsApiSigner
    def initialize(user)
      @user = user
    end

    def sign(url)
      raise 'User does not have Google configured' unless @user.google_maps_query_string.present?
      url_with_qs = "#{url}&#{@user.google_maps_query_string}"
      if @user.google_maps_client_id.present? && @user.google_maps_private_key.present?
        # Add client=xxx + signature
        cryptographically_sign_url(url_with_qs)
      else
        # Just add key=xxx
        url_with_qs
      end
    end

    private

    def cryptographically_sign_url(url)
      binary_signature = hmac(uri_path_and_query(url))
      signature = Base64.urlsafe_encode64(binary_signature)

      "#{url}&signature=#{signature}"
    end

    def uri_path_and_query(url)
      uri = URI.parse(url)
      uri.path + '?' + uri.query
    end

    def hmac(data)
      OpenSSL::HMAC.digest(OpenSSL::Digest.new('sha1'), binary_key, data)
    end

    def binary_key
      Base64.urlsafe_decode64(@user.google_maps_private_key)
    end
  end
end
