require 'google/apis/bigquery_v2'
require 'json'

module Carto
  class BigqueryTilesetsService

    MAX_DATASETS = 500
    MAX_TABLES = 500
    TILESET_LABEL = 'carto_tileset'.freeze

    def initialize(user:)
      conn = user.db_connections.where(connector: 'bigquery').first
      @project_id = conn.parameters['billing_project']
      credentials = JSON.parse(conn.parameters['service_account'])
      @bigquery_api = Google::Apis::BigqueryV2::BigqueryService.new(project: @project_id, credentials: credentials)
    end

    def list_tilesets
      list_datasets.flat_map { |dataset_id| list_tables(@project_id, dataset_id) }
    end

    private

    def list_datasets
      datasets = @bigquery_api.list_datasets(@project_id, max_results: MAX_DATASETS).datasets
      return [] unless datasets

      datasets.map { |d| d.dataset_reference.dataset_id }
    end

    def list_tables(dataset_id)
      query = Google::Apis::BigqueryV2::QueryRequest.new
      query.query = list_tables_query(dataset_id)
      resp = @bigquery_api.query_job(@project_id, query)
      resp[:result].rows.map do |row|
        { id: row.f[0].v, created_at: row.f[1].v, privacy: row.f[2].v }
      end
    end

    def list_tables_query(dataset_id)
      %{
        SELECT
          FORMAT('%s.%s.%s', tables.table_catalog, tables.table_schema, tables.table_name) as id,
          tables.creation_time as created_at,
          'private' as privacy
        FROM
          #{@project_id}.#{dataset_id}.INFORMATION_SCHEMA.TABLES as tables
        JOIN
          #{@project_id}.#{dataset_id}.INFORMATION_SCHEMA.TABLE_OPTIONS as table_options
        ON
          tables.table_catalog = table_options.table_catalog
        AND
          tables.table_schema = table_options.table_schema
        AND
          tables.table_name = table_options.table_name
        WHERE
          option_name = 'labels'
        AND
          option_value LIKE '%carto_tileset%';
      }.squish
    end

  end
end
