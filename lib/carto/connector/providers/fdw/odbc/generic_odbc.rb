require_relative './odbc'

module Carto
  class Connector

    # Generic ODBC provider passing through any ODBC connection attributes in the 'connection' parameter.
    # Either a 'driver' or a 'dns' parameter must be present in 'connection'.
    #
    # This is not meant for public use.
    #
    class GenericOdbcProvider < OdbcProvider
      metadata id: 'odbc', name: 'ODBC', public?: false # Intended for internal development/tests

      def initialize(context, params)
        super
        if @connection
          @dsn        = @connection[:dsn]
          @driver     = @connection[:driver]
        end
      end

      def errors(only_for: nil)
        errors = super
        if @connection.blank?
          errors << "Missing 'connection' parameters"
        elsif @dns.blank? && @driver.blank?
          errors << "Must define either 'dsn' or 'driver' in 'connection'"
        end
        errors
      end

      private

      # We'll map some usual names to server/user options, but in general we'll rely on
      # having unforeseen attributes defined at table level
      server_attributes %I(dsn driver host server address port database)
      user_attributes %I(uid pwd user username password)

      def connection_attributes
        @connection
      end
    end

  end
end
