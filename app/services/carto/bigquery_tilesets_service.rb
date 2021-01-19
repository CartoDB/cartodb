require 'google/apis/bigquery_v2'
require 'json'

module Carto
  class BigqueryTilesetsService

    MAX_DATASETS = 500
    MAX_TABLES = 500
    TILESET_LABEL = 'carto_tileset'.freeze

    def initialize(user:)
      @user = user
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
      tables = @bigquery_api.list_tables(project_id, dataset_id, max_results: MAX_TABLES).tables
      return [] unless tables

      tables.select { |table| table.labels.value?(TILESET_LABEL) }.map do |table|
        { id: table.id.tr(':', '.'), created_at: table.creation_time }
      end
    end

  end
end
