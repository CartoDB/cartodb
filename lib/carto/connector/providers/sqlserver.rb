# encoding: utf-8

require_relative './odbc'

module Carto
  class Connector

    # SQL Server provider using [FreeTDS](http://www.freetds.org/) driver
    #
    # For complete list of parameters, see http://www.freetds.org/userguide/odbcconnattr.htm
    #
    class SqlServerProvider < OdbcProvider
      metadata id: 'sqlserver', name: 'Microsoft SQL Server'

      fixed_odbc_attributes Driver: 'FreeTDS', AppicationIntent: 'ReadOnly'
      connection_odbc_attributes(
        username: :UID,
        password: :PWD,
        server: :Server,
        port: { Port: 1433 },
        database: :Database
      )

      private

      server_attributes %I(Driver AppicationIntent Server Database Port)
      user_attributes %I(UID PWD)

      DEFAULT_SCHEMA = 'dbo'.freeze

      def non_connection_parameters
        # Default remote schema
        super.reverse_merge(schema: DEFAULT_SCHEMA)
      end
    end
  end
end
