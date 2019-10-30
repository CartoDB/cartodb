# encoding: utf-8

require_relative './odbc'

module Carto
  class Connector

    # Redshift provider
    #
    # For complete list of parameters, see:
    # * http://docs.aws.amazon.com/redshift/latest/mgmt/configure-odbc-options.html
    #
    class RedshiftProvider < OdbcProvider

      private

      DEFAULT_SCHEMA = 'public'.freeze

      def fixed_connection_attributes
        {
          Driver:               'Amazon Redshift (x64)',
          MaxVarcharSize:       256,
          BoolsAsChar:          0
        }
      end

      def required_connection_attributes
        {
          server:   :Server,
          database: :Database,
          username: :UID
        }
      end

      def optional_connection_attributes
        {
          port: { Port: 5439 },
          password: { PWD: nil }
        }
      end

      def non_connection_parameters
        # Default remote schema
        super.reverse_merge(schema: DEFAULT_SCHEMA)
      end

      def server_attributes
        %I(Driver MaxVarcharSize BoolsAsChar Server Database Port)
      end

      def user_attributes
        %I(UID PWD)
      end
    end
  end
end
