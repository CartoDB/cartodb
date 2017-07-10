require 'base64'
require 'openssl'

module Carto
  class GoogleMapsApi
    STATIC_IMAGE_BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap'.freeze

    def sign_url(user, url)
      raise 'User does not have Google configured' unless user.google_maps_query_string.present?
      if user.google_maps_client_id.present? && user.google_maps_private_key.present?
        # Add client=xxx + signature
        client_id_signed_url(user, url)
      else
        # Just add key=xxx
        key_signed_url(user, url)
      end
    end

    def build_static_image_url(center:, map_type:, size:, zoom:, style:)
      style_string = parse_basemap_styles(style)
      STATIC_IMAGE_BASE_URL + "?center=#{center}&mapType=#{map_type}&size=#{size}#{style_string}&zoom=#{zoom}"
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

    def parse_basemap_styles(style_json)
      return '' unless style_json
      styles = style_json.map do |style_definition|
        style_parts = []
        style_parts << "feature:#{style_definition[:featureType] || 'all'}"
        style_parts << "element:#{style_definition[:elementType] || 'all'}"
        style_parts += parse_stylers(style_definition[:stylers])
        '&style=' + style_parts.join('|')
      end
      styles.join('')
    end

    def parse_stylers(stylers)
      stylers.flat_map do |styler|
        styler.map { |k, v| "#{k}:#{v.to_s.gsub('#', '0x')}" }
      end
    end
  end
end
