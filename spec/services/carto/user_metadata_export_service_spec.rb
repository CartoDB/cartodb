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

  def create_user
    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)

    @tiled_layer = FactoryGirl.create(:carto_tiled_layer)
    @user.layers << @tiled_layer

    @asset = FactoryGirl.create(:carto_asset, user: @user)

    Carto::FeatureFlagsUser.create(feature_flag: @feature_flag, user: @user)

    @user.reload
  end

  def destroy_user
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    @tiled_layer.destroy
    @asset.destroy
    @user.destroy
  end

  let(:service) { Carto::UserMetadataExportService.new }

  describe '#user export' do
    before(:all) do
      create_user
    end

    after(:all) do
      destroy_user
    end

    it 'exports' do
      export = service.export_user_json_hash(@user.id)

      expect_export_matches_user(export[:user], @user)
    end

    it 'includes all user model attributes' do
      export = service.export_user_json_hash(@user.id)

      expect(export[:user].keys).to include(*@user.attributes.symbolize_keys.keys)
    end
  end

  describe '#user import' do
    it 'imports' do
      user = service.build_user_from_hash_export(full_export)

      expect_export_matches_user(full_export[:user], user)
    end
  end

  describe '#user export + import' do
    it 'export + import' do
      create_user
      export = service.export_user_json_hash(@user.id)
      expect_export_matches_user(export[:user], @user)
      source_user = @user.attributes
      destroy_user

      imported_user = service.build_user_from_hash_export(export)
      service.save_imported_user(imported_user)
      imported_user.reload

      expect_export_matches_user(export[:user], imported_user)
      compare_excluding_dates(imported_user.attributes, source_user)
    end
  end

  describe '#full export + import (user and visualizations)' do
    it 'export + import user and visualizations' do
      Dir.mktmpdir do |path|
        create_user
        service.export_user_to_directory(@user.id, path)
        source_user = @user.attributes
        source_visualizations = @user.visualizations.map(&:attributes)
        destroy_user

        imported_user = service.import_user_from_directory(path)

        compare_excluding_dates(imported_user.attributes, source_user)
        expect(imported_user.visualizations.count).to eq source_visualizations.count
        imported_user.visualizations.zip(source_visualizations).each do |v1, v2|
          compare_excluding_dates(v1.attributes, v2)
        end
      end
    end
  end

  EXCLUDED_FIELDS = ['created_at', 'updated_at'].freeze

  def compare_excluding_dates(u1, u2)
    filtered1 = u1.reject { |k, _| EXCLUDED_FIELDS.include?(k) }
    filtered2 = u2.reject { |k, _| EXCLUDED_FIELDS.include?(k) }
    expect(filtered1).to eq filtered2
  end

  def expect_export_matches_user(export, user)
    Carto::UserMetadataExportService::EXPORTED_USER_ATTRIBUTES.each do |att|
      expect(export[att]).to eq user.send(att)
    end

    expect(export[:layers].count).to eq user.layers.size
    export[:layers].zip(user.layers).each { |exported_layer, layer| expect_export_matches_layer(exported_layer, layer) }

    expect(export[:assets].count).to eq user.assets.size
    export[:assets].zip(user.assets).each { |exported_asset, asset| expect_export_matches_asset(exported_asset, asset) }

    expect(export[:feature_flags]).to eq user.feature_flags_user.map(&:feature_flag).map(&:name)
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

  let(:full_export) do
    {
      version: "1.0.0",
      user: {
        email: "e00000002@d00000002.com",
        crypted_password: "0f865d90688f867c18bbd2f4a248537878585e6c",
        salt: "kkkkkkkkk",
        database_name: "cartodb_test_user_5be8c3d4-49f0-11e7-8698-bc5ff4c95cd0_db",
        username: "user00000001",
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
        ]
      }
    }
  end
end
