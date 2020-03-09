require 'base64'
require 'uri'
require 'openssl'


module Carto

  class UrlSigner

    def initialize(private_key)
      @private_key = private_key
    end

    def base64_decode(base64_string)
      return Base64.strict_decode64(base64_string.tr('-_','+/'))
    end

    def base64_encode(raw)
      return Base64.strict_encode64(raw).tr('+/','-_')
    end

    def sign_url(url)
      parsed_url = URI.parse(url)
      url_to_sign = parsed_url.path + '?' + parsed_url.query

      # Decode the private key
      raw_key = base64_decode(@private_key)

      # create a signature using the private key and the URL
      digest = ::OpenSSL::Digest.new('sha1')
      raw_signature = OpenSSL::HMAC.digest(digest, raw_key, url_to_sign)

      # encode the signature into base64 for url use form.
      signature =  base64_encode(raw_signature)

      # prepend the server and append the signature.
      signedUrl = parsed_url.scheme+"://"+ parsed_url.host + url_to_sign + "&signature=#{signature}"
      return signedUrl
    end

  end

end
