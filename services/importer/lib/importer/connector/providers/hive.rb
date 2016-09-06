# encoding: utf-8

require_relative './odbc'

module CartoDB
  module Importer2
    class Connector

      # Hive (HiveServer2) provider using Hortonworks driver
      # (http://public-repo-1.hortonworks.com/HDP/hive-odbc/2.1.2.1002/debian/hive-odbc-native_2.1.2.1002-2_amd64.deb)
      #
      # For all supported attributes, see http://public-repo-1.hortonworks.com/HDPDocuments/HortonworksSparkODBCDriverUserGuide.pdf
      #
      # Another driver compatible with this one is [Cloudera's](http://www.cloudera.com/downloads/connectors/hive/odbc/2-5-12.html)
      #
      class HiveProvider < OdbcProvider

        private

        def fixed_connection_attributes
          {
            Driver: 'Hortonworks Hive ODBC Driver (64-bit)',
            schema: ''
          }
        end

        def required_connection_attributes
          {
            server:   :HOST
          }
        end

        def optional_connection_attributes
          {
            port: { PORT: 10000 },
            username: { UID: nil },
            password: { PWD: nil },
            authmech: { AuthMech: 0 }
          }
        end

        def non_connection_parameters
          super.reverse_merge(schema: '')
        end

      end
    end
  end
end
