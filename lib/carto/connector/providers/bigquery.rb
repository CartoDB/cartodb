# encoding: utf-8

require_relative './odbc'

module Carto
  class Connector

    # {
    #   "provider": "bigquery",
    #   "connection": {
    #     "Driver": "Google BigQuery 64",
    #     "OAuthMechanism": 1,
    #     "Catalog": "eternal-ship-170218",
    #     "SQLDialect": 1,
    #     "RefreshToken": "1/FyCbmKonlYAwx7FMjfow9QO5mdiOG3u9dfpi0ktYxOux_fFDF6ip-PERQkXYKiDc"
    #   },
    #   "table": "destination_table",
    #   "sql_query": "select * from `eternal-ship-170218.test.test` limit 1;"
    # }
    class BigQueryProvider < OdbcProvider

      private

      DRIVER_NAME       = 'Google BigQuery 64'
      OAUTH_MECHANISM   = 1
      SQL_DIALECT       = 1

      def initialize(context, params)
        super
        begin
          @token = context.user.oauths.select('bigquery').token
          raise 'OAuth Token not found for bigquery provider' if @token.nil?
        rescue => e
          CartoDB::Logger.error(exception: e,
                                  message: 'OAuth Token not found for "bigquery" provider',
                                  user_id: context.user.id)
        end
      end

      def fixed_connection_attributes
        {
          Driver:         DRIVER_NAME,
          OAuthMechanism: OAUTH_MECHANISM,
          SQLDialect:     SQL_DIALECT,
          RefreshToken:   @token
        }
      end

      def required_connection_attributes
        {
          database: :Catalog
        }
      end

    end
  end
end
