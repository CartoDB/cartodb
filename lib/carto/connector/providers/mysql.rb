# encoding: utf-8

require_relative './odbc'

module Carto
  class Connector

    # MySQL provider using this driver: http://dev.mysql.com/doc/connector-odbc/en/
    #
    # For complete list of parameters, see:
    # https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-configuration-connection-parameters.html
    #
    class MySqlProvider < OdbcProvider

      private

      def fixed_connection_attributes
        {
          Driver:   'MySQL',
          option:   0, # see https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-configuration-connection-parameters.html#codbc-dsn-option-flags
          prefetch: 0,
          no_ssps:  0,
          can_handle_exp_pwd: 0
        }
      end

      def required_connection_attributes
        {
          username: :uid,
          password: :pwd,
          server:   :server
        }
      end

      def optional_connection_attributes
        {
          port: { port: 3306 },
          database: { database: nil }
        }
      end

      def non_connection_parameters
        # database acts like schema name in MySQL
        super.reverse_merge(schema: @connection[:database])
      end
    end
  end
end
# DSL:
#  parameter :username, :required, :primary, default: nil, attribute: :uid
