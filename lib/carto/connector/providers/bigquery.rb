# encoding: utf-8

require 'uri'
require_relative './odbc'

module Carto
  class Connector

    # {
    #   "provider": "bigquery",
    #   "connection": {
    #     "Catalog": "eternal-ship-170218"
    #   },
    #   "table": "destination_table",
    #   "sql_query": "select * from `eternal-ship-170218.test.test` limit 1;"
    # }
    class BigQueryProvider < OdbcProvider

      private

      # Class constants
      DATASOURCE_NAME              = 'bigquery'

      # Driver constants
      DRIVER_NAME                  = 'Simba ODBC Driver for Google BigQuery 64-bit'
      SQL_DIALECT                  = 1
      OAUTH_MECHANISM              = 1
      LRESULTS                     = 0
      LRESULTS_DATASET_ID          = '{_bqodbc_temp_tables}'
      LRESULTS_TEMP_TABLE_EXP_TIME = '3600000'

      def initialize(context, params)
        super
        @oauth_config = Cartodb.get_config(:oauth, DATASOURCE_NAME)
        raise 'OAuth configuration not found for BigQuery provider' if @oauth_config.nil?
        raise 'Client Id and Client Secret MUST be defined' if @oauth_config['client_id'].nil? || @oauth_config['client_secret'].nil?
        validate_config!(context) if context
      end

      def validate_config!(context)
        refreshTokenErrMsg = 'BigQuery refresh token not found for the user'
        begin
          @token = context.user.oauths.select(DATASOURCE_NAME).token
          raise refreshTokenErrMsg if @token.nil?
        rescue => e
          CartoDB::Logger.error(exception: e,
                                  message: refreshTokenErrMsg,
                                  user_id: context.user.id)
        end
      end

      def fixed_connection_attributes
        proxy_conf = create_proxy_conf

        conf = {
          Driver:         DRIVER_NAME,
          SQLDialect:     SQL_DIALECT,
          OAuthMechanism: OAUTH_MECHANISM,
          RefreshToken:   @token,
          ClientId: @oauth_config['client_id'],
          ClientSecret: @oauth_config['client_secret'],
          AllowLargeResults: LRESULTS,
          LargeResultsDataSetId: LRESULTS_DATASET_ID,
          LargeResultsTempTableExpirationTime: LRESULTS_TEMP_TABLE_EXP_TIME
        }

        if !proxy_conf.nil?
          conf = conf.merge(proxy_conf)
        end

        return conf
      end

      def required_connection_attributes
        {
          database:       :Catalog
        }
      end

      def create_proxy_conf
        proxy = ENV['HTTP_PROXY'] || ENV['http_proxy']
        if !proxy.nil?
          proxy = URI.parse(proxy)
          {
            ProxyHost: proxy.host,
            ProxyPort: proxy.port
          }
        end
      end

    end
  end
end
