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

      # BigQuery provider add the list_projects feature
      def features_information
        super.merge(list_projects: true)
      end

      def check_connection
        ok = false
        if @oauth_client
          ok = @oauth_client.token_valid?
        end
        ok
      end

      def list_projects
        # TODO
        []
      end

      def list_tables_by_project(project_id)
        # TODO
        []
      end

      private

      # Notes regarding IMPORT (extermal) schema and the DefaultDataset parameter:
      # * For tables DefaultDataset is unnecesary (but does not harm if present),
      #   the IMPORT (extermal) schema is necessary and the one which defines the dataset.
      # * For queries (sql_query), IMPORT (extermal) schema  is ignored and
      #   the DefaultDataset is necessary when table names are not qualified with the dataset.

      server_attributes %I(
        Driver Catalog SQLDialect OAuthMechanism ClientId ClientSecret EnableHTAPI
        AllowLargeResults UseDefaultLargeResultsDataset UseQueryCache HTAPI_MinActivationRatio
        HTAPI_MinResultsSize LargeResultsDataSetId LargeResultsTempTableExpirationTime
      )
      user_attributes %I(RefreshToken)

      required_parameters %I(project table)
      optional_parameters %I(from_project import_as dataset sql_query storage_api)

      # Class constants
      DATASOURCE_NAME              = id

      # Driver constants
      DRIVER_NAME                  = 'Simba ODBC Driver for Google BigQuery 64-bit'
      SQL_DIALECT                  = 1
      OAUTH_MECHANISM              = 1
      LRESULTS                     = 1
      LRESULTS_DEFAULT_DATASET     = 0
      HTAPI_MIN_ACTIVATION_RATIO   = 0

      def initialize(context, params)
        super
        @oauth_config = Cartodb.get_config(:oauth, DATASOURCE_NAME)
        @connector_config = Cartodb.get_config(:connectors, DATASOURCE_NAME)
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

        datasource_oauth = context.user.oauths.select(DATASOURCE_NAME)
        @oauth_client = datasource_oauth&.get_service_datasource
        @token = datasource_oauth&.token

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
          UseDefaultLargeResultsDataset: LRESULTS_DEFAULT_DATASET,
          HTAPI_MinActivationRatio: HTAPI_MIN_ACTIVATION_RATIO,
          EnableHTAPI: @connector_config['storage_api'],
          UseQueryCache: @connector_config['query_cache'],
          HTAPI_MinResultsSize: @connector_config['storage_api_min_results'],
          LargeResultsDataSetId: @connector_config['storage_api_tmp_dataset'],
          LargeResultsTempTableExpirationTime: @connector_config['storage_api_tmp_table_exp']
        }

        if !proxy_conf.nil?
          conf = conf.merge(proxy_conf)
        end

        return conf
      end

      def remote_schema_name
        # Note that DefaultDataset may not be defined and not needed when using IMPORT FOREIGN SCHEMA
        # is used with a query (sql_query). Since it is actually ignored in that case we'll used
        # and arbitrary name in that case.
        schema_name = 'unused'
        if @params[:dataset].present?
          schema_name = @params[:from_project].present? ?
            @params[:from_project] + "." + @params[:dataset]
            : @params[:dataset]
        end
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
