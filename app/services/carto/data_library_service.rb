require_relative '../../../services/sql-api/sql_api'

module Carto
  class DataLibraryService
    # - source_api_key is used to retrieve metadata from the dataset
    # - granted_api_key is stored as the one to use for the importing
    def load_dataset!(carto_api_client,
                      source_dataset:, source_username:, source_api_key:,
                      target_username:, granted_api_key:)
      target_user = Carto::User.find_by_username(target_username)
      raise Carto::LoadError("User not found: #{target_username}") unless target_user

      remote_visualization = carto_api_client.get_visualization_v1(
        username: source_username, name: source_dataset, params: { api_key: source_api_key }
      )
      remote_table = remote_visualization[:table]
      privacy = target_user.default_dataset_privacy
      remote_attributes = remote_visualization.slice(:name, :description, :tags, :license, :source, :attributions)

      base_url = "#{carto_api_client.scheme}://#{carto_api_client.base_url(source_username)}"
      sql_api_url = CartoDB::SQLApi.with_username_api_key(source_username, granted_api_key, privacy, base_url: base_url)
                                   .export_table_url(source_dataset)
      external_source = Carto::ExternalSource.new(
        import_url: sql_api_url,
        rows_counted: remote_table[:row_count],
        size: remote_table[:size],
        geometry_types: remote_table[:geometry_types],
        username: source_username
      )
      visualization = Carto::Visualization.create!(
        remote_attributes.merge(
          display_name: display_name(remote_visualization),
          user: target_user,
          type: Carto::Visualization::TYPE_REMOTE,
          privacy: privacy,
          external_source: external_source
        )
      )

      visualization
    end

    def load_datasets!(carto_api_client,
                       source_username:, source_api_key:,
                       target_username:, granted_api_key:)
      api_keys = carto_api_client.get_api_keys_v3(username: source_username, params: { api_key: granted_api_key })
      api_key = api_keys[:result].find { |key| key[:token] == granted_api_key }

      return unless api_key

      database_grants = api_key[:grants].select { |g| g[:type] == 'database' }
      database_grants.each do |database_grant|
        tables = database_grant[:tables]
        tables.each do |table|
          if table[:permissions].include?('select')
            load_dataset!(carto_api_client,
                          source_dataset: table[:name],
                          source_username: source_username, source_api_key: source_api_key,
                          target_username: target_username, granted_api_key: granted_api_key)
          end
        end
      end
    end

    private

    def display_name(remote_visualization)
      remote_visualization[:display_name].presence || remote_visualization[:name]
    end
  end
end
