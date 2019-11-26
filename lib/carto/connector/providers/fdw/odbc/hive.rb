require_relative './odbc'

module Carto
  class Connector

    # Hive (HiveServer2) provider using Hortonworks driver
    # (http://public-repo-1.hortonworks.com/HDP/hive-odbc/2.1.2.1002/debian/hive-odbc-native_2.1.2.1002-2_amd64.deb)
    #
    # For all supported attributes, see https://hortonworks.com/wp-content/uploads/2015/10/Hortonworks-Hive-ODBC-Driver-User-Guide.pdf
    #
    # Another driver compatible with this one is [Cloudera's](http://www.cloudera.com/downloads/connectors/hive/odbc/2-5-12.html)
    #
    # The schema acts as a database name here, and can be ommitted (default schema 'default' or '')
    # So we'll use a `database` connection parameter for the schema for consistency with other providers.
    # The schema parameter should not be directly used by the user.
    class HiveProvider < OdbcProvider
      metadata id: 'hive', name: 'Hive'

      DEFAULT_SCHEMA = 'default'.freeze # '' would also be OK

      fixed_odbc_attributes Driver: 'Hortonworks Hive ODBC Driver 64-bit'
      connection_odbc_attributes(
        server: :HOST,
        database: { Schema: DEFAULT_SCHEMA },
        port:     { PORT: 10000 },
        username: { UID: nil },
        password: { PWD: nil }
      )

      private

      server_attributes %I(Driver HOST PORT Schema)
      user_attributes %I(UID PWD)

      def non_connection_parameters
        super.reverse_merge(schema: @connection[:database] || DEFAULT_SCHEMA)
      end
    end
  end
end
