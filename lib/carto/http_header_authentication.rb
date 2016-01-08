# encoding: utf-8

module Carto
  class HttpHeaderAuthentication
    def valid?(request)
      header_value(request.headers).present?
    end

    def header_value(headers)
      header = Cartodb.get_config(:http_header_authentication, 'header')
      header.present? ? headers[header] : nil
    end
  end
end
