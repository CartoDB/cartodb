require 'uri'
require_relative './odbc'

module Carto
  class Connector

  # {
  #     "provider": "bigquery",
  #     "billing_project": "cartodb-on-gcp-core-team",
  #     "dataset": "f1",
  #     "table": "circuits",
  #     "import_as": "my_circuits",
  #     "storage_api": true
  # }
  class BigQueryProvider < OdbcProvider
      metadata id: 'bigquery', name: 'Google BigQuery', public?: true

      odbc_attributes billing_project: :Catalog, storage_api: :EnableHTAPI, project: :AdditionalProjects, dataset: { DefaultDataset: nil }

      def errors(only_for: nil)
        parameters_to_validate = @params.normalize_parameter_names(only_for)
        dataset_errors = []
        if parameters_to_validate.blank? || parameters_to_validate.include?(:dataset)
          # dataset is not optional if not using a query
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
        oauth_client = @sync_oauth&.get_service_datasource
        if oauth_client
          ok = oauth_client.token_valid?
        end
        ok
      end

      def list_projects
        oauth_client = @sync_oauth&.get_service_datasource
        if oauth_client
          oauth_client.list_projects.map { |p| p[:id] }
        end
      end

      def list_tables_by_project(project_id)
        tables = []
        oauth_client = @sync_oauth&.get_service_datasource
        if oauth_client
          oauth_client.list_datasets(project_id).each do |dataset|
            dataset_id = dataset[:id]
            oauth_client.list_tables(project_id, dataset_id).each do |table|
              # tables << { project_id: project_id, dataset_id: dataset_id, table_id: table[:id] }
              tables << table[:full_id]
            end
          end
        end
        tables
      end

      def parameters_to_odbc_attributes(params, optional_params, required_params)
        super(params, optional_params, required_params).map { |k, v|
          if v == true
            v = 1
          elsif v == false
            v = 0
          end
          [k, v]
        }
      end

      def table_options
        params = super
        # due to driver limitations (users need specific permissions in
        # their projects) table imports have to be imported as sql_query
        if !params[:sql_query].present?
          project = @params[:project] || @params[:billing_project]
          params[:sql_query] = table_query
        end
        params
      end

      def table_query
        project = @params[:project] || @params[:billing_project]
        %{SELECT * FROM `#{project}.#{@params[:dataset]}.#{@params[:table]}`;}
      end

      def list_tables(limits: {})
        tables = []
        limit = limits[:max_listed_tables]
        oauth_client = @sync_oauth&.get_service_datasource
        if oauth_client
          oauth_client.list_projects.each do |project|
            project_id = project[:id]
            oauth_client.list_datasets(project_id).each do |dataset|
              dataset_id = dataset[:id]
              oauth_client.list_tables(project_id, dataset_id).each do |table|
                tables << {
                  project: project_id,
                  dataset: dataset_id,
                  schema: dataset[:full_id],
                  name: table.id,
                }
                break if tables.size >= limit
              end
            end
          end
        end
      end

      private

      # Notes regarding IMPORT (extermal) schema and the DefaultDataset parameter:
      # * For tables DefaultDataset is unnecesary (but does not harm if present),
      #   the IMPORT (extermal) schema is necessary and the one which defines the dataset.
      # * For queries (sql_query), IMPORT (extermal) schema  is ignored and
      #   the DefaultDataset is necessary when table names are not qualified with the dataset.

      server_attributes %I(
        Driver
        Catalog
        SQLDialect
        OAuthMechanism
        ClientId
        ClientSecret
        EnableHTAPI
        AllowLargeResults
        UseQueryCache
        HTAPI_MinActivationRatio
        HTAPI_MinResultsSize
        UseDefaultLargeResultsDataset
        LargeResultsDataSetId
        LargeResultsTempTableExpirationTime
        AdditionalProjects
      )
      user_attributes %I(RefreshToken)

      required_parameters %I(billing_project)
      optional_parameters %I(project location import_as dataset table sql_query storage_api)

      # Class constants
      DATASOURCE_NAME              = id

      # Driver constants
      DRIVER_NAME                  = 'Simba ODBC Driver for Google BigQuery 64-bit'
      SQL_DIALECT                  = 1
      OAUTH_MECHANISM              = 1
      ALLOW_LRESULTS               = 0
      ENABLE_STORAGE_API           = 0
      QUERY_CACHE                  = 1
      HTAPI_MIN_ACTIVATION_RATIO   = 0
      HTAPI_MIN_RESULTS_SIZE       = 100
      HTAPI_TEMP_DATASET           = '_cartoimport_temp'
      HTAPI_TEMP_TABLE_EXP         = 3600000

      def initialize(context, params)
        super
        @oauth_config = Cartodb.get_config(:oauth, DATASOURCE_NAME)
        @sync_oauth = context&.user&.oauths&.select(DATASOURCE_NAME)
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

        if @sync_oauth.blank?
          raise "Missing OAuth credentials for BigQuery: user must authorize"
        end
      end

      def token
        # We can get a validated token (having obtained a refreshed access token) with
        #   @token ||= @sync_oauth&.get_service_datasource&.token
        # But since the ODBC driver takes care of obtaining a fresh access token
        # that's unnecessary.
        @token ||= @sync_oauth&.token
      end

      def fixed_odbc_attributes
        return @server_conf if @server_conf.present?

        proxy_conf = create_proxy_conf

        @server_conf = {
          Driver:         DRIVER_NAME,
          SQLDialect:     SQL_DIALECT,
          OAuthMechanism: OAUTH_MECHANISM,
          RefreshToken:   token,
          ClientId: @oauth_config['client_id'],
          ClientSecret: @oauth_config['client_secret'],
          AllowLargeResults: ALLOW_LRESULTS,
          HTAPI_MinActivationRatio: HTAPI_MIN_ACTIVATION_RATIO,
          EnableHTAPI: ENABLE_STORAGE_API,
          UseQueryCache: QUERY_CACHE,
          HTAPI_MinResultsSize: HTAPI_MIN_RESULTS_SIZE,
          LargeResultsTempTableExpirationTime: HTAPI_TEMP_TABLE_EXP
        }

        if @params[:storage_api] == true
          @server_conf = @server_conf.merge({
            UseDefaultLargeResultsDataset: 1
          })
          if @params[:location].present?
            @params[:location].upcase!
            @server_conf = @server_conf.merge({
              UseDefaultLargeResultsDataset: 0,
              LargeResultsDataSetId: create_temp_dataset(@params[:billing_project], @params[:location])
          })
          end
        end

        # Perform a dry-run of the query to catch errors (API permissions, SQL syntax, etc.)
        # Note that the import may stil fail if using Storage API and needed permission is missing.
        sql = @params[:sql_query] || table_query
        result = dry_run(@params[:billing_project], sql)
        if result[:error]
          # TODO: avoid rescuing errors in dry_run? return our own exception here?
          raise result[:client_error]
        end
        # TODO: could we make result[:total_bytes_processed] available?

        if !proxy_conf.nil?
          @server_conf = @server_conf.merge(proxy_conf)
        end

        return @server_conf
      end

      def create_temp_dataset(project_id, location)
        temp_dataset_id = %{#{HTAPI_TEMP_DATASET}_#{location.downcase}}
        oauth_client = @sync_oauth&.get_service_datasource
        if oauth_client
          begin
            oauth_client.create_dataset(project_id, temp_dataset_id, {
              :default_table_expiration_ms => HTAPI_TEMP_TABLE_EXP,
              :location => location
            })
          rescue Google::Apis::ClientError => error
            # if the dataset exists (409 conflict) do it nothing
            raise error unless error.status_code == 409
          end
        end
        temp_dataset_id
      end

      def dry_run(project_id, sql)
        oauth_client = @sync_oauth&.get_service_datasource
        if oauth_client
          oauth_client.dry_run(project_id, sql)
        else
          {
            error: false
          }
        end

      end

      def remote_schema_name
        # Note that DefaultDataset may not be defined and not needed when using IMPORT FOREIGN SCHEMA
        # is used with a query (sql_query). Since it is actually ignored in that case we'll used
        # and arbitrary name in that case.
        @params[:dataset] || 'unused'
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
