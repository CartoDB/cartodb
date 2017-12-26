# encoding: utf-8

require_relative './odbc'

module Carto
  class Connector

    # Generic ODBC provider passing through any ODBC connection attributes in the 'connection' parameter.
    # Either a 'driver' or a 'dns' parameter must be present in 'connection'.
    #
    # This is not meant for public use.
    #
    class GenericOdbcProvider < OdbcProvider

      def initialize(context, params)
        super
        if @connection
          @dsn        = @connection[:dsn]
          @driver     = @connection[:driver]
        end
      end

      def errors(only: nil)
        errors = super
        if @connection.blank?
          errors << "Missing 'connection' parameters"
        elsif @dns.blank? && @driver.blank?
          errors << "Must define either 'dsn' or 'driver' in 'connection'"
        end
        errors
      end

      private

      def connection_attributes
        @connection
      end
    end

  end
end
