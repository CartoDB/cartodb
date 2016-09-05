# encoding: utf-8

require_relative './odbc'

module CartoDB
  module Importer2
    class Connector

      # Generic ODBC provider passing through any ODBC connection attributes in the 'connection' parameter.
      # Either a 'driver' or a 'dns' parameter must be present in 'connection'.
      #
      # This is not meant for public use.
      #
      class GenericOdbcProvider < OdbcProvider

        def initialize(params)
          super
          @connection = Support.fetch_ignoring_case(@params, 'connection')
          if @connection
            @dsn        = Support.fetch_ignoring_case(@connection, 'dsn')
            @driver     = Support.fetch_ignoring_case(@connection, 'driver')
          end
        end

        private

        def connection_errors
          errors = []
          if @connection.blank?
            errors << "Missing 'connection' parameters"
          else
            errors << "Must define either 'dsn' or 'driver' in 'connection'" if @dns.blank? && @driver.blank?
          end
          errors
        end

        def connection_attributes
          Support.fetch_ignoring_case @params, 'connection'
        end

      end

    end
  end
end
