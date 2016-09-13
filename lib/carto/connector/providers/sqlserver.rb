# encoding: utf-8

require_relative './odbc'

module Carto
  class Connector

    # SQL Server provider using [FreeTDS](http://www.freetds.org/) driver
    #
    # For complete list of parameters, see http://www.freetds.org/userguide/odbcconnattr.htm
    #
    class SqlServerProvider < OdbcProvider

      private

      DEFAULT_SCHEMA = 'dbo'.freeze

      def fixed_connection_attributes
        {
          Driver:               'FreeTDS',
          AppicationIntent:     'ReadOnly'
        }
      end

      def required_connection_attributes
        {
          username: :UID,
          password: :PWD,
          server:   :Server,
          database: :Database
        }
      end

      def optional_connection_attributes
        {
          port: { Port: 1433 }
        }
      end

      def non_connection_parameters
        # Default remote schema
        super.reverse_merge(schema: DEFAULT_SCHEMA)
      end
    end
  end
end
