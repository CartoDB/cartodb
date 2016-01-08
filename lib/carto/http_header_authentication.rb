# encoding: utf-8
require_relative 'uuidhelper'

module Carto
  class HttpHeaderAuthentication
    include Carto::UUIDHelper

    def valid?(request)
      value = header_value(request.headers)
      !value.nil? && !value.empty?
    end

    def get_user(request)
      header = header_value(request.headers)
      return nil if header.nil? || header.empty?

      ::User.where("#{field(request)} = ?", header).first
    end

    private

    def field(request)
      field = Cartodb.get_config(:http_header_authentication, 'field')
      field == 'auto' ? field_from_value(request) : field
    end

    def field_from_value(request)
      value = header_value(request.headers)

      if value.include?('@')
        'email'
      elsif is_uuid?(value)
        'id'
      else
        'username'
      end
    end

    def header_value(headers)
      header = ::Cartodb.get_config(:http_header_authentication, 'header')
      !header.nil? && !header.empty? ? headers[header] : nil
    end
  end
end
