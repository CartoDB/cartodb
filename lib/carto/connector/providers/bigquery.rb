# encoding: utf-8

require 'uri'
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
      SQL_DIALECT       = 1
      USER_AUTH         = 1
      SERVICE_AUTH      = 0

      def initialize(context, params)
        super
        @oauth_config = Cartodb.get_config(:oauth, 'bigquery')
        validate_config!(context)
      end

      def validate_config!(context)
        raise 'OAuth configuration not found for bigquery provider' if @oauth_config.nil?
        if @oauth_config['oauth_mechanism'] === SERVICE_AUTH \
            and @oauth_config['email'].nil? \
            and @oauth_config['key'].nil?
          raise 'bigquery provider configured in SERVICE_AUTH mode but email or key not present'
        else
          begin
          @token = context.user.oauths.select('bigquery').token
          raise 'OAuth Token not found for bigquery provider' if @token.nil?
          rescue => e
            CartoDB::Logger.error(exception: e,
                                    message: 'OAuth Token not found for "bigquery" provider',
                                    user_id: context.user.id)
          end
        end
      end

      def fixed_connection_attributes
        oauth_mechanism = @oauth_config['oauth_mechanism']
        proxy_conf = create_proxy_conf

        if oauth_mechanism === SERVICE_AUTH
          conf = {
            Driver:         DRIVER_NAME,
            SQLDialect:     SQL_DIALECT,
            OAuthMechanism: oauth_mechanism,
            Email:          @oauth_config['email'],
            KeyFilePath:    @oauth_config['key']
          }
        else
          conf = {
            Driver:         DRIVER_NAME,
            SQLDialect:     SQL_DIALECT,
            OAuthMechanism: oauth_mechanism,
            RefreshToken:   @token
          }
        end

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
