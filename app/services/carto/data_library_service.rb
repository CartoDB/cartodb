require_relative '../../../services/sql-api/sql_api'

module Carto
  class DataLibraryService
    # - source_api_key is used to retrieve metadata from the dataset
    # - granted_api_key is stored as the one to use for the importing
    def load_dataset!(carto_api_client,
                      source_dataset:, source_username:, source_api_key:,
                      target_username:, granted_api_key:)
      target_user = Carto::User.find_by_username(target_username)

      remote_visualization = carto_api_client.get_visualization_v1(
        username: source_username, name: source_dataset, params: { api_key: source_api_key }
      )
      remote_table = remote_visualization[:table]
      privacy = target_user.default_dataset_privacy
      visualization = Carto::Visualization.create!(
        name: remote_visualization[:name],
        display_name: display_name(remote_visualization),
        user: target_user,
        type: Carto::Visualization::TYPE_REMOTE,
        privacy: privacy,
        description: remote_visualization[:description],
        tags: remote_visualization[:tags],
        license: remote_visualization[:license],
        source: remote_visualization[:source],
        attributions: remote_visualization[:attributions]
      )
      base_url = "#{carto_api_client.scheme}://#{carto_api_client.base_url(source_username)}"
      sql_api_url = CartoDB::SQLApi.with_username_api_key(source_username, granted_api_key, privacy, base_url: base_url)
                                   .export_table_url(source_dataset)
      Carto::ExternalSource.create!(
        visualization: visualization,
        import_url: sql_api_url,
        rows_counted: remote_table[:row_count],
        size: remote_table[:size],
        geometry_types: remote_table[:geometry_types],
        username: target_username
      )

      visualization
    end

    private

    def display_name(remote_visualization)
      remote_visualization[:display_name].presence || remote_visualization[:name]
    end
  end
end
