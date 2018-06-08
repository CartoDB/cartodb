require 'json'
require 'carto/export/layer_exporter'
require 'carto/export/data_import_exporter'
require_dependency 'carto/export/connector_configuration_exporter'

# Not migrated
# client_applications & friends -> deprecated?
# likes -> difficult to do between clouds
# snapshots -> difficult to do between clouds, not in use yet
# tags -> regenerated from tables
# visualization_export -> only purpose would be logging

# Version History
# 1.0.0: export user metadata
# 1.0.1: export search tweets
# 1.0.2: export user notifications
# 1.0.3: export rate limits
# 1.0.4: company and phone in users table
# 1.0.5: synchronization_oauths and connector configurations
module Carto
  module UserMetadataExportServiceConfiguration
    CURRENT_VERSION = '1.0.5'.freeze
    EXPORTED_USER_ATTRIBUTES = [
      :email, :crypted_password, :salt, :database_name, :username, :admin, :enabled, :invite_token, :invite_token_date,
      :map_enabled, :quota_in_bytes, :table_quota, :account_type, :private_tables_enabled, :period_end_date,
      :map_view_quota, :max_layers, :database_timeout, :user_timeout, :upgraded_at, :map_view_block_price,
      :geocoding_quota, :dashboard_viewed_at, :sync_tables_enabled, :database_host, :geocoding_block_price, :api_key,
      :notification, :organization_id, :created_at, :updated_at, :disqus_shortname, :id, :twitter_username, :website,
      :description, :name, :avatar_url, :database_schema, :soft_geocoding_limit, :auth_token,
      :twitter_datasource_enabled, :twitter_datasource_block_price, :twitter_datasource_block_size,
      :twitter_datasource_quota, :soft_twitter_datasource_limit, :available_for_hire, :private_maps_enabled,
      :google_sign_in, :last_password_change_date, :max_import_file_size, :max_import_table_row_count,
      :max_concurrent_import_count, :last_common_data_update_date, :google_maps_key, :google_maps_private_key,
      :enable_account_token, :location, :here_isolines_quota, :here_isolines_block_price, :soft_here_isolines_limit,
      :obs_snapshot_quota, :obs_snapshot_block_price, :soft_obs_snapshot_limit, :mobile_xamarin,
      :mobile_custom_watermark, :mobile_offline_maps, :mobile_gis_extension, :mobile_max_open_users,
      :mobile_max_private_users, :obs_general_quota, :obs_general_block_price, :soft_obs_general_limit, :viewer,
      :salesforce_datasource_enabled, :builder_enabled, :geocoder_provider, :isolines_provider, :routing_provider,
      :github_user_id, :engine_enabled, :mapzen_routing_quota, :mapzen_routing_block_price, :soft_mapzen_routing_limit,
      :no_map_logo, :org_admin, :last_name, :user_render_timeout, :database_render_timeout, :frontend_version,
      :asset_host, :state, :company, :phone, :industry, :job_role
    ].freeze

    BLANK_UUID = '00000000-0000-0000-0000-000000000000'.freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module UserMetadataExportServiceImporter
    include UserMetadataExportServiceConfiguration
    include LayerImporter
    include DataImportImporter
    include ConnectorConfigurationImporter

    def build_user_from_json_export(exported_json_string)
      build_user_from_hash_export(parse_json(exported_json_string))
    end

    def build_user_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      build_user_from_hash(exported_hash[:user])
    end

    def build_search_tweets_from_json_export(exported_json_string)
      build_search_tweets_from_hash_export(parse_json(exported_json_string))
    end

    def build_search_tweets_from_hash_export(exported_hash)
      exported_hash[:user].fetch(:search_tweets, []).map { |st| build_search_tweet_from_hash(st) }
    end

    def save_imported_user(user)
      user.save!
      ::User[user.id].after_save
    end

    def save_imported_search_tweet(search_tweet, user)
      if search_tweet.data_import
        persisted_import = Carto::DataImport.where(id: search_tweet.data_import.id).first
        search_tweet.data_import = persisted_import if persisted_import
        search_tweet.table_id = search_tweet.data_import.table_id
      else
        # Some search tweets can be exported without data import if the FK point to a non-existent data import.
        # However, this field is NOT NULL, so we cannot leave it empty.
        # We could skip the import of the tweet, but instead, we keep it with an invalid ID (like in the source), so
        # we can still correctly compute quota usage.
        search_tweet.data_import_id = BLANK_UUID
      end
      search_tweet.user = user
      search_tweet.save!
    end

    private

    def parse_json(exported_json_string)
      JSON.parse(exported_json_string, symbolize_names: true)
    end

    def build_user_from_hash(exported_user)
      user = User.new(exported_user.slice(*EXPORTED_USER_ATTRIBUTES))

      user.feature_flags_user = exported_user[:feature_flags].map { |ff_name| build_feature_flag_from_name(ff_name) }
                                                             .compact

      user.assets = exported_user[:assets].map { |asset| build_asset_from_hash(asset.symbolize_keys) }

      user.layers = build_layers_from_hash(exported_user[:layers])

      user.rate_limit = build_rate_limit_from_hash(exported_user[:rate_limit])

      api_keys = exported_user[:api_keys] || []
      user.api_keys += api_keys.map { |api_key| Carto::ApiKey.new_from_hash(api_key) }

      if exported_user[:notifications]
        user.static_notifications = Carto::UserNotification.create(notifications: exported_user[:notifications])
      end

      user.synchronization_oauths = build_synchronization_oauths_from_hash(exported_user[:synchronization_oauths])

      user.connector_configurations = build_connector_configurations_from_hash(exported_user[:connector_configurations])

      # Must be the last one to avoid attribute assignments to try to run SQL
      user.id = exported_user[:id]
      user
    end

    def build_feature_flag_from_name(ff_name)
      ff = FeatureFlag.where(name: ff_name).first
      if ff
        FeatureFlagsUser.new(feature_flag_id: ff.id)
      else
        CartoDB::Logger.warning(message: 'Feature flag not found in user import', feature_flag: ff_name)
        nil
      end
    end

    def build_asset_from_hash(exported_asset)
      Asset.new(
        public_url: exported_asset[:public_url],
        kind: exported_asset[:kind],
        storage_info: exported_asset[:storage_info]
      )
    end

    def build_search_tweet_from_hash(exported_search_tweet)
      SearchTweet.new(
        data_import: build_data_import_from_hash(exported_search_tweet[:data_import]),
        service_item_id: exported_search_tweet[:service_item_id],
        retrieved_items: exported_search_tweet[:retrieved_items],
        state: exported_search_tweet[:state],
        created_at: exported_search_tweet[:created_at],
        updated_at: exported_search_tweet[:updated_at]
      )
    end

    def build_rate_limit_from_hash(exported_hash)
      return unless exported_hash

      rate_limit = Carto::RateLimit.from_api_attributes(exported_hash[:limits])
      rate_limit.id = exported_hash[:id]

      rate_limit
    end

    def build_synchronization_oauths_from_hash(exported_array)
      return [] unless exported_array.present?

      exported_array.map { |so| build_synchronization_oauth_from_hash(so) }
    end

    def build_synchronization_oauth_from_hash(exported_hash)
      SynchronizationOauth.new(
        service: exported_hash[:service],
        token: exported_hash[:token],
        created_at: exported_hash[:created_at],
        updated_at: exported_hash[:updated_at]
      )
    end
  end

  module UserMetadataExportServiceExporter
    include UserMetadataExportServiceConfiguration
    include LayerExporter
    include DataImportExporter
    include ConnectorConfigurationExporter

    def export_user_json_string(user)
      export_user_json_hash(user).to_json
    end

    def export_user_json_hash(user)
      {
        version: CURRENT_VERSION,
        user: export(user)
      }
    end

    private

    def export(user)
      user_hash = EXPORTED_USER_ATTRIBUTES.map { |att| [att, user.attributes[att.to_s]] }.to_h

      user_hash[:feature_flags] = user.feature_flags_user.map(&:feature_flag).map(&:name)

      user_hash[:assets] = user.assets.map { |a| export_asset(a) }

      user_hash[:layers] = user.layers.map { |l| export_layer(l) }

      user_hash[:search_tweets] = user.search_tweets.map { |st| export_search_tweet(st) }

      user_hash[:api_keys] = user.api_keys.map { |api_key| export_api_key(api_key) }

      user_hash[:rate_limit] = export_rate_limit(user.rate_limit)

      user_hash[:notifications] = user.static_notifications.notifications

      user_hash[:synchronization_oauths] = user.synchronization_oauths.map { |so| export_synchronization_oauth(so) }

      user_hash[:connector_configurations] = user.connector_configurations.map do |cc|
        export_connector_configuration(cc)
      end

      user_hash
    end

    def export_asset(asset)
      {
        public_url: asset.public_url,
        kind: asset.kind,
        storage_info: asset.storage_info
      }
    end

    def export_search_tweet(search_tweet)
      {
        data_import: export_data_import(search_tweet.data_import),
        service_item_id: search_tweet.service_item_id,
        retrieved_items: search_tweet.retrieved_items,
        state: search_tweet.state,
        created_at: search_tweet.created_at,
        updated_at: search_tweet.updated_at
      }
    end

    def export_api_key(api_key)
      {
        created_at: api_key.created_at,
        db_password: api_key.db_password,
        db_role: api_key.db_role,
        name: api_key.name,
        token: api_key.token,
        type: api_key.type,
        updated_at: api_key.updated_at,
        grants: api_key.grants,
        user_id: api_key.user_id
      }
    end

    def export_rate_limit(rate_limit)
      return unless rate_limit

      {
        id: rate_limit.id,
        limits: rate_limit.api_attributes
      }
    end

    def export_synchronization_oauth(sync_oauth)
      {
        service: sync_oauth.service,
        token: sync_oauth.token,
        created_at: sync_oauth.created_at,
        updated_at: sync_oauth.updated_at
      }
    end
  end

  class UserAlreadyExists < RuntimeError; end

  # Both String and Hash versions are provided because `deep_symbolize_keys` won't symbolize through arrays
  # and having separated methods make handling and testing much easier.
  class UserMetadataExportService
    include UserMetadataExportServiceImporter
    include UserMetadataExportServiceExporter

    def export_to_directory(user, path)
      root_dir = Pathname.new(path)
      root_dir.mkpath

      user_json = export_user_json_string(user)
      root_dir.join("user_#{user.id}.json").open('w') { |file| file.write(user_json) }

      redis_json = Carto::RedisExportService.new.export_user_json_string(user)
      root_dir.join("redis_user_#{user.id}.json").open('w') { |file| file.write(redis_json) }

      export_user_visualizations_to_directory(user, Carto::Visualization::TYPE_REMOTE, path)
      export_user_visualizations_to_directory(user, Carto::Visualization::TYPE_CANONICAL, path)
      export_user_visualizations_to_directory(user, Carto::Visualization::TYPE_DERIVED, path)
    end

    def import_from_directory(path)
      user = user_from_file(path)

      raise UserAlreadyExists.new if ::Carto::User.exists?(id: user.id)
      save_imported_user(user)

      Carto::RedisExportService.new.restore_redis_from_json_export(redis_user_file(path))

      user
    end

    def rollback_import_from_directory(path)
      user = user_from_file(path)
      return unless user

      user = ::User[user.id]
      return unless user

      carto_user = Carto::User.find(user.id)
      carto_user.assets.each(&:delete)
      carto_user.destroy
      user.before_destroy(skip_table_drop: true)

      Carto::RedisExportService.new.remove_redis_from_json_export(redis_user_file(path))
    rescue ActiveRecord::RecordNotFound
      # User was not created so not found and no redis removal needed
    end

    def import_user_visualizations_from_directory(user, type, meta_path)
      with_non_viewer_user(user) do
        Dir["#{meta_path}/#{type}_*#{Carto::VisualizationExporter::EXPORT_EXTENSION}"].each do |fname|
          imported_vis = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(File.read(fname))
          Carto::VisualizationsExportPersistenceService.new.save_import(user, imported_vis, full_restore: true)
          if Carto::VisualizationsExportService2.new.marked_as_vizjson2_from_json_export?(File.read(fname))
            imported_vis.mark_as_vizjson2
          end
        end
      end
    end

    def import_metadata_from_directory(user, meta_path)
      import_user_visualizations_from_directory(user, Carto::Visualization::TYPE_REMOTE, meta_path)
      import_user_visualizations_from_directory(user, Carto::Visualization::TYPE_CANONICAL, meta_path)
      import_user_visualizations_from_directory(user, Carto::Visualization::TYPE_DERIVED, meta_path)

      import_search_tweets_from_directory(user, meta_path)
    end

    def import_search_tweets_from_directory(user, meta_path)
      user_file = user_file_dir(meta_path)
      search_tweets = build_search_tweets_from_json_export(File.read(user_file))
      search_tweets.each { |st| save_imported_search_tweet(st, user) }
    end

    private

    def user_from_file(path)
      build_user_from_json_export(File.read(user_file_dir(path)))
    end

    def user_file_dir(path)
      Dir["#{path}/user_*.json"].first
    end

    def redis_user_file(path)
      File.read(Dir["#{path}/redis_user_*.json"].first)
    end

    def export_user_visualizations_to_directory(user, type, path)
      root_dir = Pathname.new(path)
      user.visualizations.where(type: type).each do |visualization|
        next if visualization.canonical? && should_skip_canonical_viz_export(visualization)
        next if !visualization.remote? && visualization.map.nil?

        visualization_export = Carto::VisualizationsExportService2.new.export_visualization_json_string(
          visualization.id, user, with_password: true
        )
        filename = "#{visualization.type}_#{visualization.id}#{Carto::VisualizationExporter::EXPORT_EXTENSION}"
        root_dir.join(filename).open('w') { |file| file.write(visualization_export) }
      end
    end

    def should_skip_canonical_viz_export(viz)
      return true if viz.table.nil?

      viz.user.visualizations.where(type: viz.type,
                                    name: viz.name).all.sort_by(&:updated_at).last.id != viz.id
    end

    def with_non_viewer_user(user)
      was_viewer = user.viewer
      if user.viewer
        user.update_attributes(viewer: false)
        ::User[user.id].reload
      end

      yield
    ensure
      if was_viewer
        user.update_attributes(viewer: true)
        ::User[user.id].reload
      end
    end
  end
end
