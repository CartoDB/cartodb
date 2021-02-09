require_relative '../connection_adapter'
require_relative 'bigquery'

module Carto
  class ConnectionAdapter
    class Factory

      BQ_CONNECTOR = 'bigquery'.freeze

      def self.adapter_for_connection(connection)
        case connection.connector
        when BQ_CONNECTOR
          Carto::ConnectionAdapter::BigQuery.new(connection)
        else
          Carto::ConnectionAdapter.new(connection)
        end
      end

    end
  end
end
