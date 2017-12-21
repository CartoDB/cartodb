require 'spec_helper_min'
require 'factories/carto_visualizations'

describe Carto::UserMetadataExportService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations

  before(:all) do
    bypass_named_maps
    @feature_flag = FactoryGirl.create(:carto_feature_flag)
  end

  after(:all) do
    @feature_flag.destroy
  end

  def create_user_with_basemaps_assets_visualizations
    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)

    @tiled_layer = FactoryGirl.create(:carto_tiled_layer)
    @user.layers << @tiled_layer

    @asset = FactoryGirl.create(:carto_asset, user: @user)

    Carto::FeatureFlagsUser.create(feature_flag: @feature_flag, user: @user)

    CartoDB::GeocoderUsageMetrics.new(@user.username).incr(:geocoder_here, :success_responses)

    # Convert @table_visualization into a common data imported table
    sync = FactoryGirl.create(:carto_synchronization, user: @user)
    @table_visualization.update_attributes!(synchronization: sync)
    @table.data_import = FactoryGirl.create(:data_import, user: @user, synchronization_id: sync.id, table_id: @table.id)
    @table.save!
    edi = FactoryGirl.create(:external_data_import_with_external_source,
                             data_import: @table.data_import, synchronization: sync)
    @remote_visualization = edi.external_source.visualization
    @remote_visualization.update_attributes!(user: @user)

    # Create SearchTweets: one associated to an existing table, and one with invalid table
    @map2, @table2, @table_visualization2, @visualization2 = create_full_visualization(@user, visualization_attributes: { name: 'waduswadus22' })
    @table2.data_import = FactoryGirl.create(:data_import, user: @user, table_id: @table2.id)
    @table2.save!
    @st1 = FactoryGirl.create(:carto_search_tweet, user_id: @user.id, data_import_id: @table2.data_import.id)
    @st2 = FactoryGirl.create(:carto_search_tweet, user_id: @user.id, data_import_id: FactoryGirl.create(:data_import).id)

    @user.reload
  end

  def destroy_user
    gum = CartoDB::GeocoderUsageMetrics.new(@user.username)
    $users_metadata.DEL(gum.send(:user_key_prefix, :geocoder_here, :success_responses, DateTime.now))

    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    destroy_full_visualization(@map2, @table2, @table_visualization2, @visualization2)
    @remote_visualization.destroy
    @table.data_import.destroy
    @tiled_layer.destroy
    @asset.destroy
    [@st1, @st2].each do |st|
      st.data_import.destroy
      st.destroy
    end
    @user.destroy
  end

  let(:service) { Carto::UserMetadataExportService.new }

  describe '#user export' do
    before(:all) do
      create_user_with_basemaps_assets_visualizations
    end

    after(:all) do
      destroy_user
    end

    it 'exports' do
      export = service.export_user_json_hash(@user)

      expect_export_matches_user(export[:user], @user)
    end

    it 'includes all user model attributes' do
      export = service.export_user_json_hash(@user)

      expect(export[:user].keys).to include(*@user.attributes.symbolize_keys.keys)
    end
  end

  describe '#user import' do
    it 'imports' do
      user = service.build_user_from_hash_export(full_export)
      search_tweets = service.build_search_tweets_from_hash_export(full_export)
      search_tweets.each { |st| service.save_imported_search_tweet(st, user) }

      expect_export_matches_user(full_export[:user], user)
    end
  end

  describe '#user export + import' do
    it 'export + import' do
      create_user_with_basemaps_assets_visualizations
      export = service.export_user_json_hash(@user)
      expect_export_matches_user(export[:user], @user)
      source_user = @user.attributes
      destroy_user

      imported_user = service.build_user_from_hash_export(export)
      service.save_imported_user(imported_user)
      imported_user.reload

      search_tweets = service.build_search_tweets_from_hash_export(export)
      search_tweets.each { |st| service.save_imported_search_tweet(st, imported_user) }

      expect_export_matches_user(export[:user], imported_user)
      compare_excluding_dates(imported_user.attributes, source_user)
    end
  end

  describe '#full export + import (user and visualizations)' do
    it 'export + import user and visualizations' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations
        @visualization.mark_as_vizjson2
        service.export_to_directory(@user, path)
        source_user = @user.attributes

        source_visualizations = @user.visualizations.order(:id).map(&:attributes)
        source_tweets = @user.search_tweets.map(&:attributes)
        destroy_user

        # At this point, the user database is still there, but the tables got destroyed. We recreate some dummy ones
        source_visualizations.select { |v| v['type'] == 'table' }.each do |v|
          @user.in_database.execute("CREATE TABLE #{v['name']} (cartodb_id int)")
        end

        # Clean redis for vizjson2 marking
        $tables_metadata.del(Carto::Visualization::V2_VISUALIZATIONS_REDIS_KEY)
        expect(@visualization.uses_vizjson2?).to be_false

        imported_user = service.import_from_directory(path)
        service.import_metadata_from_directory(imported_user, path)

        compare_excluding_dates(imported_user.attributes, source_user)
        expect_redis_restored(imported_user)
        expect(imported_user.visualizations.count).to eq source_visualizations.count
        imported_user.visualizations.order(:id).zip(source_visualizations).each do |v1, v2|
          compare_excluding_dates_and_ids(v1.attributes, v2)
        end

        expect(@visualization.uses_vizjson2?).to be_true
        imported_user.search_tweets.zip(source_tweets).each do |st1, st2|
          expect(st1.user_id).to eq imported_user.id
          expect(st1.service_item_id).to eq st2['service_item_id']
          expect(st1.retrieved_items).to eq st2['retrieved_items']
          expect(st1.state).to eq st2['state']
        end
      end
    end

    it 'export + import user and visualizations for a viewer user' do
      Dir.mktmpdir do |path|
        create_user_with_basemaps_assets_visualizations
        @user.update_attributes(viewer: true)
        ::User[@user.id].reload # Refresh Sequel cache
        service.export_to_directory(@user, path)
        source_user = @user.attributes

        source_visualizations = @user.visualizations.order(:id).map(&:attributes)
        source_tweets = @user.search_tweets.map(&:attributes)
        @user.update_attributes(viewer: false) # For destruction purposes
        destroy_user

        # At this point, the user database is still there, but the tables got destroyed. We recreate some dummy ones
        source_visualizations.select { |v| v['type'] == 'table' }.each do |v|
          @user.in_database.execute("CREATE TABLE #{v['name']} (cartodb_id int)")
        end

        imported_user = service.import_from_directory(path)
        service.import_metadata_from_directory(imported_user, path)

        compare_excluding_dates(imported_user.attributes, source_user)
        expect_redis_restored(imported_user)
        expect(imported_user.visualizations.count).to eq source_visualizations.count
        imported_user.visualizations.order(:id).zip(source_visualizations).each do |v1, v2|
          compare_excluding_dates_and_ids(v1.attributes, v2)
        end
        imported_user.search_tweets.zip(source_tweets).each do |st1, st2|
          expect(st1.user_id).to eq imported_user.id
          expect(st1.service_item_id).to eq st2['service_item_id']
          expect(st1.retrieved_items).to eq st2['retrieved_items']
          expect(st1.state).to eq st2['state']
        end
      end
    end
  end

  EXCLUDED_USER_META_DATE_FIELDS = ['created_at', 'updated_at'].freeze
  EXCLUDED_USER_META_ID_FIELDS = ['map_id', 'permission_id', 'active_layer_id', 'tags'].freeze

  def compare_excluding_dates_and_ids(v1, v2)
    filtered1 = v1.reject { |k, _| EXCLUDED_USER_META_ID_FIELDS.include?(k) }
    filtered2 = v2.reject { |k, _| EXCLUDED_USER_META_ID_FIELDS.include?(k) }
    compare_excluding_dates(filtered1, filtered2)
  end

  def compare_excluding_dates(u1, u2)
    filtered1 = u1.reject { |k, _| EXCLUDED_USER_META_DATE_FIELDS.include?(k) }
    filtered2 = u2.reject { |k, _| EXCLUDED_USER_META_DATE_FIELDS.include?(k) }
    expect(filtered1).to eq filtered2
  end

  def expect_export_matches_user(export, user)
    Carto::UserMetadataExportService::EXPORTED_USER_ATTRIBUTES.each do |att|
      expect(export[att]).to eq(user.attributes[att.to_s]), "attribute #{att.inspect} expected: #{user.attributes[att.to_s].inspect} got: #{export[att].inspect}"
    end

    expect(export[:layers].count).to eq user.layers.size
    export[:layers].zip(user.layers).each { |exported_layer, layer| expect_export_matches_layer(exported_layer, layer) }

    expect(export[:assets].count).to eq user.assets.size
    export[:assets].zip(user.assets).each { |exported_asset, asset| expect_export_matches_asset(exported_asset, asset) }

    expect(export[:feature_flags]).to eq user.feature_flags_user.map(&:feature_flag).map(&:name)

    expect(export[:search_tweets].count).to eq user.search_tweets.size
    export[:search_tweets].zip(user.search_tweets).each do |exported_search_tweet, search_tweet|
      expect_export_matches_search_tweet(exported_search_tweet, search_tweet)
    end
  end

  def expect_export_matches_layer(exported_layer, layer)
    expect(exported_layer[:options]).to eq layer.options
    expect(exported_layer[:kind]).to eq layer.kind
  end

  def expect_export_matches_asset(exported_asset, asset)
    expect(exported_asset[:public_url]).to eq asset.public_url
    expect(exported_asset[:kind]).to eq asset.kind
    expect(exported_asset[:storage_info]).to eq asset.storage_info
  end

  def expect_redis_restored(user)
    expect(CartoDB::GeocoderUsageMetrics.new(user.username).get(:geocoder_here, :success_responses)).to eq(1)
  end

  def expect_export_matches_search_tweet(exported_search_tweet, search_tweet)
    expect(exported_search_tweet[:data_import][:id]).to eq search_tweet.data_import.id
    expect(exported_search_tweet[:service_item_id]).to eq search_tweet.service_item_id
    expect(exported_search_tweet[:retrieved_items]).to eq search_tweet.retrieved_items
    expect(exported_search_tweet[:state]).to eq search_tweet.state
    expect(exported_search_tweet[:created_at]).to eq search_tweet.created_at
    expect(exported_search_tweet[:updated_at]).to eq search_tweet.updated_at
  end

  let(:full_export) do
    {
      version: "1.0.0",
      user: {
        email: "e00000002@d00000002.com",
        crypted_password: "0f865d90688f867c18bbd2f4a248537878585e6c",
        salt: "kkkkkkkkk",
        database_name: "cartodb_test_user_5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0_db",
        username: "user00000001",
        state: 'active',
        admin: nil,
        enabled: true,
        invite_token: nil,
        invite_token_date: nil,
        map_enabled: true,
        quota_in_bytes: 5000000,
        table_quota: nil,
        account_type: "FREE",
        private_tables_enabled: false,
        period_end_date: nil,
        map_view_quota: 10000,
        max_layers: 8,
        database_timeout: 300000,
        user_timeout: 300000,
        database_render_timeout: 0,
        user_render_timeout: 0,
        upgraded_at: nil,
        map_view_block_price: nil,
        geocoding_quota: 0,
        dashboard_viewed_at: nil,
        sync_tables_enabled: false,
        database_host: "localhost",
        geocoding_block_price: nil,
        api_key: "21ee521b8a107ea55d61fd7b485dd93d54c0b9d2",
        notification: nil,
        organization_id: nil,
        created_at: DateTime.now,
        updated_at: DateTime.now,
        disqus_shortname: nil,
        id: "5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0",
        twitter_username: nil,
        website: nil,
        description: nil,
        name: nil,
        avatar_url: "example.com/avatars/avatar_stars_red.png",
        database_schema: "public",
        soft_geocoding_limit: false,
        auth_token: nil,
        twitter_datasource_enabled: nil,
        twitter_datasource_block_price: nil,
        twitter_datasource_block_size: nil,
        twitter_datasource_quota: 0,
        soft_twitter_datasource_limit: false,
        available_for_hire: false,
        private_maps_enabled: false,
        google_sign_in: false,
        last_password_change_date: nil,
        max_import_file_size: 157286400,
        max_import_table_row_count: 500000,
        max_concurrent_import_count: 3,
        last_common_data_update_date: nil,
        google_maps_key: nil,
        google_maps_private_key: nil,
        enable_account_token: nil,
        location: nil,
        here_isolines_quota: 0,
        here_isolines_block_price: nil,
        soft_here_isolines_limit: false,
        obs_snapshot_quota: 0,
        obs_snapshot_block_price: nil,
        soft_obs_snapshot_limit: false,
        mobile_xamarin: false,
        mobile_custom_watermark: false,
        mobile_offline_maps: false,
        mobile_gis_extension: false,
        mobile_max_open_users: 0,
        mobile_max_private_users: 0,
        obs_general_quota: 0,
        obs_general_block_price: nil,
        soft_obs_general_limit: false,
        viewer: false,
        salesforce_datasource_enabled: false,
        builder_enabled: nil,
        geocoder_provider: nil,
        isolines_provider: nil,
        routing_provider: nil,
        github_user_id: nil,
        engine_enabled: true,
        mapzen_routing_quota: nil,
        mapzen_routing_block_price: nil,
        soft_mapzen_routing_limit: false,
        no_map_logo: false,
        org_admin: false,
        last_name: nil,
        feature_flags: [Carto::FeatureFlag.first.name],
        assets: [
          {
            public_url: "https://manolo.es/es/co/bar.png",
            kind: nil,
            storage_info: nil
          }
        ],
        layers: [
          {
            options: {
              "default" => true,
              "url" => "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
              "subdomains" => "abcd",
              "minZoom" => "0",
              "maxZoom" => "18",
              "attribution" => "© <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> ...",
              "urlTemplate" => "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
              "type" => "Tiled",
              "name" => "Positron Labels"
            },
            kind: "tiled"
          }
        ],
        search_tweets: [
          {
            data_import: {
              data_source: '/path',
              data_type: 'file',
              table_name: 'twitter_cartodb',
              state: 'complete',
              success: true,
              log: {
                type: 'import',
                entries: ''
              },
              updated_at: DateTime.now,
              created_at: DateTime.now,
              error_code: nil,
              queue_id: nil,
              tables_created_count: nil,
              table_names: nil,
              append: false,
              migrate_table: nil,
              table_copy: nil,
              from_query: nil,
              id: '118813f4-c943-4583-822e-111ed0b51ca4',
              service_name: 'twitter_search',
              service_item_id: '{\"dates\":{\"fromDate\":\"2014-07-29\",\"fromHour\":0,\"fromMin\":0,\"toDate\":\"2014-08-27\",\"toHour\":23,\"toMin\":59,\"user_timezone\":0,\"max_days\":30},\"categories\":[{\"terms\":[\"cartodb\"],\"category\":\"1\",\"counter\":1007}]}',
              stats: '{}',
              type_guessing: true,
              quoted_fields_guessing: true,
              content_guessing: false,
              server: nil,
              host: nil,
              upload_host: nil,
              resque_ppid: nil,
              create_visualization: false,
              visualization_id: nil,
              user_defined_limits: '{}',
              import_extra_options: nil,
              original_url: '',
              privacy: nil,
              cartodbfy_time: 0.0,
              http_response_code: nil,
              rejected_layers: nil,
              runner_warnings: nil,
              collision_strategy: nil,
              external_data_imports: []
            },
            service_item_id: '{\"dates\":{\"fromDate\":\"2014-07-29\",\"fromHour\":0,\"fromMin\":0,\"toDate\":\"2014-08-27\",\"toHour\":23,\"toMin\":59,\"user_timezone\":0,\"max_days\":30},\"categories\":[{\"terms\":[\"cartodb\"],\"category\":\"1\",\"counter\":1007}]}',
            retrieved_items: 123,
            state: 'complete',
            created_at: DateTime.now,
            updated_at: DateTime.now
          }
        ]
      }
    }
  end
end
