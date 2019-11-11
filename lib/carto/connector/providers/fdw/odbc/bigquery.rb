require 'uri'
require_relative './odbc'

module Carto
  class Connector

    # {
    #   "provider": "bigquery",
    #   "project": "eternal-ship-170218",
    #   "table": "destination_table",
    #   "sql_query": "select * from `eternal-ship-170218.test.test` limit 1;"
    # }
    #
    # {
    #   "provider": "bigquery",
    #   "project": "some_project",
    #   "dataset": "mydataset",
    #   "table": "mytable"
    # }
    class BigQueryProvider < OdbcProvider
      metadata id: 'bigquery', name: 'Google BigQuery', public?: false

      odbc_attributes project: :Catalog, dataset: { DefaultDataset: nil }

      def errors(only_for: nil)
        # dataset is not optional if not using a query
        parameters_to_validate = @params.normalize_parameter_names(only_for)
        dataset_errors = []
        if parameters_to_validate.blank? || parameters_to_validate.include?(:dataset)
          if !@params.normalized_names.include?(:dataset) && !@params.normalized_names.include?(:sql_query)
            dataset_errors << "The dataset parameter is needed for tables"
          end
        end
        super + dataset_errors
      end

      private

      # Notes regarding IMPORT (extermal) schema and the DefaultDataset parameter:
      # * For tables DefaultDataset is unnecesary (but does not harm if present),
      #   the IMPORT (extermal) schema is necessary and the one which defines the dataset.
      # * For queries (sql_query), IMPORT (extermal) schema  is ignored and
      #   the DefaultDataset is necessary when table names are not qualified with the dataset.

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
        validate_config!(context)
      end

      def validate_config!(context)
        # If a user is not provided we omit validation, because the
        # instantiated provider can be used for operations that don't require
        # a connection such as obtaining metadata (list_tables?, features_information, etc.)
        return if !context || !context.user

        if @oauth_config.nil? || @oauth_config['client_id'].nil? || @oauth_config['client_secret'].nil?
          raise "Missing OAuth configuration for BigQuery: Client ID & Secret must be defined"
        end

        @token = context.user.oauths.select(DATASOURCE_NAME)&.token
        raise AuthError.new('BigQuery refresh token not found for the user', DATASOURCE_NAME) if @token.nil?
      end

      def fixed_odbc_attributes
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

      required_parameters %I(project table)
      optional_parameters %I(dataset sql_query)

      def remote_schema_name
        # Note that DefaultDataset may not be defined and not needed when using IMPORT FOREIGN SCHEMA
        # is used with a query (sql_query). Since it is actually ignored in that case we'll used
        # and arbitrary name in that case.
        table_options[:odbc_DefaultDataset] || 'unused' # @params[:dataset] || 'unused'
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
