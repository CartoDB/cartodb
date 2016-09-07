# encoding: utf-8

require_relative './odbc'

module CartoDB
  module Importer2
    class Connector

      # SQL Server provider using [FreeTDS](http://www.freetds.org/) driver
      #
      # For complete list of parameters, see http://www.freetds.org/userguide/odbcconnattr.htm
      #
      class SqlServerProvider < OdbcProvider

        private

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
          super.reverse_merge(schema: 'dbo')
        end
      end
    end
  end
end
