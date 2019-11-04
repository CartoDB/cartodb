# encoding: utf-8

require 'uri'
require_relative './odbc'

module Carto
  class Connector

    # {
    #   "provider": "bigquery",
    #   "connection": {
    #     "project": "eternal-ship-170218"
    #   },
    #   "table": "destination_table",
    #   "sql_query": "select * from `eternal-ship-170218.test.test` limit 1;"
    # }
    #
    # {
    #   "provider": "bigquery",
    #   "connection": {
    #     "project": "some_project"
    #   },
    #   "table": "mytable",
    #   "dataset": "mydataset"
    # }
    class BigQueryProvider < OdbcProvider
      metadata id: 'bigquery', name: 'Google BigQuery', public?: false

      required_connection_attributes project: :Catalog

      private

      server_attributes %I(
        Driver Catalog SQLDialect OAuthMechanism ClientId ClientSecret
        AllowLargeResults LargeResultsDataSetId LargeResultsTempTableExpirationTime
      )
      user_attributes %I(RefreshToken)

      # Class constants
      DATASOURCE_NAME              = id

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
        validate_config!(context)
      end

      def validate_config!(context)
        # If a user is not provided we omit validation, because the
        # instantiated provider can be used for operations that don't require
        # a connection such as obtaining metadata (list_tables?, features_information, etc.)
        return if !context || !context.user

        @token = context.user.oauths.select(DATASOURCE_NAME)&.token
        raise AuthError.new('BigQuery refresh token not found for the user', DATASOURCE_NAME) if @token.nil?
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

      optional_parameters %I(table connection)
      required_parameters %I(dataset sql_query)

      def non_connection_parameters
        super.reverse_merge(schema: @params[:dataset])
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
