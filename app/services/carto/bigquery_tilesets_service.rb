require 'google/apis/bigquery_v2'
require 'date'

module Carto
  class BigqueryTilesetsService

    MAX_DATASETS = 500
    MAX_TABLES = 500
    TILESET_LABEL = 'carto_tileset'.freeze
    SCOPES = %w(https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/bigquery).freeze
    MAX_TIMEOUT = 3600
    MAX_CLIENT_RETRIES = 3

    def initialize(user:)
      conn = user.db_connections.where(connector: 'bigquery').first
      raise Carto::LoadError, 'Missing bigquery connector' unless conn

      @project_id = conn.parameters['billing_project']
      service_account = conn.parameters['service_account']

      client_options = Google::Apis::ClientOptions.new
      client_options.open_timeout_sec = MAX_TIMEOUT
      client_options.read_timeout_sec = MAX_TIMEOUT

      request_options = Google::Apis::RequestOptions.new
      request_options.retries = MAX_CLIENT_RETRIES

      @bigquery_api = Google::Apis::BigqueryV2::BigqueryService.new
      @bigquery_api.authorization = Google::Auth::ServiceAccountCredentials.make_creds(
        json_key_io: StringIO.new(service_account), scope: SCOPES
      )
    end

    def list_tilesets
      list_datasets.flat_map { |dataset_id| list_tables(dataset_id) }
    end

    private

    def list_datasets
      datasets = @bigquery_api.list_datasets(@project_id, max_results: MAX_DATASETS).datasets
      return [] unless datasets

      datasets.map { |d| d.dataset_reference.dataset_id }
    end

    def list_tables(dataset_id)
      table_list = @bigquery_api.list_tables(@project_id, dataset_id)
      return [] unless table_list.tables

      table_list.tables.select { |table| table.labels.present? && table.labels.key?('carto_tileset') }.map do |table|
        policy_options = Google::Apis::BigqueryV2::GetPolicyOptions.new
        policy_options.requested_policy_version = 1
        policy_request = Google::Apis::BigqueryV2::GetIamPolicyRequest.new
        policy_request.options = policy_options
        project, dataset, tablename = table.id.tr(':', '.').split('.')
        resource = "projects/#{project}/datasets/#{dataset}/tables/#{tablename}"
        policy = @bigquery_api.get_table_iam_policy(resource, policy_request)
        # TODO: inspect policy to determine the owner and if the tileset is public or private
        { id: table.id.tr(':', '.'), created_at: table.creation_time, privacy: 'private' }
      end
    end

    # def list_tables(dataset_id)
    #   query = Google::Apis::BigqueryV2::QueryRequest.new
    #   query.query = list_tables_query(dataset_id)
    #   query.use_legacy_sql = false
    #   query.use_query_cache = true
    #   resp = @bigquery_api.query_job(@project_id, query)
    #   return [] unless resp.rows

    #   resp.rows.map do |row|
    #     { id: row.f[0].v, created_at: (row.f[1].v.to_f * 1000).to_i, privacy: row.f[2].v }
    #   end
    # end

    # def list_tables_query(dataset_id)
    #   %{
    #     SELECT
    #       FORMAT('%s.%s.%s', tables.table_catalog, tables.table_schema, tables.table_name) as id,
    #       tables.creation_time as created_at,
    #       'private' as privacy
    #     FROM
    #       `#{@project_id}`.#{dataset_id}.INFORMATION_SCHEMA.TABLES as tables
    #     JOIN
    #       `#{@project_id}`.#{dataset_id}.INFORMATION_SCHEMA.TABLE_OPTIONS as table_options
    #     ON
    #       tables.table_catalog = table_options.table_catalog
    #     AND
    #       tables.table_schema = table_options.table_schema
    #     AND
    #       tables.table_name = table_options.table_name
    #     WHERE
    #       option_name = 'labels'
    #     AND
    #       option_value LIKE '%carto_tileset%';
    #   }.squish
    # end

  end
end
