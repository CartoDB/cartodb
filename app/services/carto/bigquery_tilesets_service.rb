require 'google/apis/bigquery_v2'

module Carto
  class BigqueryTilesetsService

    MAX_DATASETS = 500
    MAX_TABLES = 500
    TILESET_LABEL = 'carto_tileset'.freeze

    def initialize(user:)
      @user = user
      @project_id = nil
      @credentials = nil
      @bigquery_api = Google::Apis::BigqueryV2::BigqueryService.new(project: @project, credentials: @credentials)
    end

    def list_tilesets()
      list_datasets(@project_id).flat_map { |dataset_id| list_tables(@project_id, dataset_id) }
    end

    private

    def list_datasets(project_id)
      datasets = @bigquery_api.list_datasets(project_id, max_results: MAX_DATASETS).datasets
      if datasets
        datasets.map { |d| d.dataset_reference.dataset_id }
      else
        []
      end
    end

    def list_tables(project_id, dataset_id)
      tables = @bigquery_api.list_tables(project_id, dataset_id, max_results: MAX_TABLES).tables
      if tables
        tables.select { |table| table.labels.value?(TILESET_LABEL) }.map do |table|
          { id: table.id.tr(':', '.'), created_at: table.creation_time }
        end
      else
        []
      end
    end

  end
end
