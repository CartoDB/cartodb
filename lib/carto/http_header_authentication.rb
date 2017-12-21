# encoding: utf-8
require_dependency 'carto/uuidhelper'

module Carto
  class HttpHeaderAuthentication
    include Carto::UUIDHelper

    def valid?(request)
      value = header_value(request.headers)
      !value.nil? && !value.empty?
    end

    def get_user(request)
      header = identity(request)
      return nil if header.nil? || header.empty?

      ::User.where("#{field(request)} = ?", header).first
    end

    def autocreation_enabled?
      Cartodb.get_config(:http_header_authentication, 'autocreation') == true
    end

    def autocreation_valid?(request)
      autocreation_enabled? && field(request) == 'email'
    end

    def identity(request)
      header_value(request.headers)
    end

    def email(request)
      raise "Configuration is not set to email, or it's auto but request hasn't email" unless field(request) == 'email'
      identity(request)
    end

    def creation_in_progress?(request)
      header = identity(request)
      return false unless header

      Carto::UserCreation.in_progress.where("#{user_creation_field(request)} = ?", header).first.present?
    end

    private

    def field(request)
      field = Cartodb.get_config(:http_header_authentication, 'field')
      field == 'auto' ? field_from_value(request) : field
    end

    def user_creation_field(request)
      field = field(request)
      case field
      when 'username', 'email'
        field
      when 'id'
        'user_id'
      else
        raise "Unknown field #{field}"
      end
    end

    def field_from_value(request)
      value = header_value(request.headers)
      return nil unless value

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
