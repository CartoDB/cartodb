require_relative '../connection_adapter'
require_relative 'bigquery'

module Carto
  class ConnectionAdapter
    class Factory
      def self.adapter_for_connection(connection)
        case connection.connector
        when 'bigquery'
          Carto::ConnectionAdapter::BigQuery.new(connection)
        else
          Carto::ConnectionAdapter.new(connection)
        end
      end
    end
  end
end
