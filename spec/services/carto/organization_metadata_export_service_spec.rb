require 'spec_helper_min'
require 'factories/carto_visualizations'

describe Carto::OrganizationMetadataExportService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations
  include TableSharing

  def create_organization_with_dependencies
    @sequel_organization = FactoryGirl.create(:organization_with_users)
    @organization = Carto::Organization.find(@sequel_organization.id)
    @owner = @organization.owner
    @non_owner = @organization.users.reject(&:organization_owner?).first

    @map, @table, @table_visualization, @visualization = create_full_visualization(@non_owner)
    share_visualization_with_user(@table_visualization, @owner)

    @asset = FactoryGirl.create(:carto_asset, organization: @organization)

    @organization.reload
  end

  def destroy_organization
    Organization[@organization.id].destroy_cascade
  end
    def import_organization_and_users_from_directory(path)
      # Import organization
      organization_file = Dir["#{path}/organization_*.json"].first
      organization = build_organization_from_json_export(File.read(organization_file))
      save_imported_organization(organization)

      user_list = Dir["#{path}/user_*"]

      # In order to get permissions right, we first import all users, then all datasets and finally, all maps
      organization.users = user_list.map do |user_path|
        Carto::UserMetadataExportService.new.import_user_from_directory(user_path, import_visualizations: false)
      end

      organization
    end

    def import_organization_visualizations_from_directory(organization, path)
      organization.users.each do |user|
        Carto::UserMetadataExportService.new.import_user_visualizations_from_directory(
          user, Carto::Visualization::TYPE_CANONICAL, "#{path}/user_#{user.id}"
        )
      end

      organization.users.each do |user|
        Carto::UserMetadataExportService.new.import_user_visualizations_from_directory(
          user, Carto::Visualization::TYPE_DERIVED, "#{path}/user_#{user.id}"
        )
      end

      organization
    end
  let(:service) { Carto::OrganizationMetadataExportService.new }

  describe '#organization export' do
    before(:all) do
      create_organization_with_dependencies
    end

    after(:all) do
      destroy_organization
    end

    it 'exports' do
      export = service.export_organization_json_hash(@organization.id)

      expect_export_matches_organization(export[:organization], @organization)
    end

    it 'includes all user model attributes' do
      export = service.export_organization_json_hash(@organization.id)

      expect(export[:organization].keys).to include(*@organization.attributes.symbolize_keys.keys)
    end
  end

  describe '#organization import' do
    it 'imports' do
      organization = service.build_organization_from_hash_export(full_export)

      expect_export_matches_organization(full_export[:organization], organization)
    end
  end

  describe '#organization export + import' do
    it 'export + import' do
      create_organization_with_dependencies
      export = service.export_organization_json_hash(@organization.id)
      expect_export_matches_organization(export[:organization], @organization)
      source_organization = @organization.attributes
      destroy_organization

      imported_organization = service.build_organization_from_hash_export(export)
      service.save_imported_organization(imported_organization)
      imported_organization.reload

      expect_export_matches_organization(export[:organization], imported_organization)
      compare_excluding_dates(imported_organization.attributes, source_organization)
    end
  end

  describe '#full export + import (organization, users and visualizations)' do
    it 'export + import organization, users and visualizations' do
      Dir.mktmpdir do |path|
        create_organization_with_dependencies
        service.export_organization_to_directory(@organization.id, path)
        source_organization = @organization.attributes
        source_users = @organization.users.map(&:attributes)

        # Destroy, keeping the database
        Table.any_instance.stubs(:remove_table_from_user_database)
        @organization.users.flat_map(&:visualizations).each(&:destroy)
        @organization.users.each(&:destroy)
        @organization.destroy

        imported_organization = service.import_organization_and_users_from_directory(path)
        import_organization_visualizations_from_directory(imported_organization, path)

        compare_excluding_dates(imported_organization.attributes, source_organization)
        expect(imported_organization.users.count).to eq source_users.count
        imported_organization.users.zip(source_users).each do |u1, u2|
          compare_excluding_dates(u1.attributes, u2)
        end
      end
    end
  end

  EXCLUDED_DATE_FIELDS = ['created_at', 'updated_at', 'period_end_date'].freeze

  def compare_excluding_dates(u1, u2)
    filtered1 = u1.reject { |k, _| EXCLUDED_DATE_FIELDS.include?(k) }
    filtered2 = u2.reject { |k, _| EXCLUDED_DATE_FIELDS.include?(k) }
    expect(filtered1).to eq filtered2
  end

  def expect_export_matches_organization(export, organization)
    Carto::OrganizationMetadataExportService::EXPORTED_ORGANIZATION_ATTRIBUTES.each do |att|
      expect(export[att]).to eq organization.attributes[att.to_s]
    end

    expect(export[:assets].count).to eq organization.assets.size
    export[:assets].zip(organization.assets).each { |exported_asset, asset| expect_export_matches_asset(exported_asset, asset) }
  end

  def expect_export_matches_asset(exported_asset, asset)
    expect(exported_asset[:public_url]).to eq asset.public_url
    expect(exported_asset[:kind]).to eq asset.kind
    expect(exported_asset[:storage_info]).to eq asset.storage_info
  end

  let(:full_export) do
    {
      version: "1.0.0",
      organization: {
        id: "189d642c-c7da-40aa-bffd-517aa0eb7999",
        seats: 100,
        quota_in_bytes: 99999999997,
        created_at: DateTime.now,
        updated_at: DateTime.now,
        name: "worg",
        avatar_url: nil,
        owner_id: "06b974db-de0d-49b7-ae9b-76c63af8c122",
        website: "",
        description: "",
        display_name: "",
        discus_shortname: "",
        twitter_organizationname: nil,
        geocoding_quota: 0,
        map_view_quota: nil,
        auth_token: "pgYcd8XnAn46HlczpvQcIw",
        geocoding_block_price: nil,
        map_view_block_price: nil,
        twitter_datasource_enabled: true,
        twitter_datasource_block_price: 100,
        twitter_datasource_block_size: 1000,
        twitter_datasource_quota: 1,
        google_maps_key: "key=AIzaSyBYumNYEyM18D9te7PeArJ_pinDIPyYVts",
        google_maps_private_key: nil,
        color: "#FF9900",
        default_quota_in_bytes: 209715200,
        whitelisted_email_domains: ["carto.com", "worg.com"],
        admin_email: "worg1@worg.com",
        auth_username_password_enabled: nil,
        auth_google_enabled: true,
        location: nil,
        here_isolines_quota: 0,
        here_isolines_block_price: nil,
        strong_passwords_enabled: false,
        obs_snapshot_quota: 0,
        obs_snapshot_block_price: nil,
        obs_general_quota: 999999999,
        obs_general_block_price: nil,
        salesforce_datasource_enabled: false,
        viewer_seats: 100,
        geocoder_provider: "heremaps",
        isolines_provider: "heremaps",
        routing_provider: "mapzen",
        auth_github_enabled: true,
        engine_enabled: true,
        mapzen_routing_quota: nil,
        mapzen_routing_block_price: nil,
        builder_enabled: true,
        auth_saml_configuration: {},
        no_map_logo: false,
        assets: [{
          public_url: "http://localhost.lan:3000/uploads/organization_assets/189d642c-c7da-40aa-bffd-517aa0eb7999/asset_download_148430456220170113-20961-67b7r0",
          kind: "organization_asset",
          storage_info: {
            type: "local",
            location: "organization_assets",
            identifier: "public/uploads/organization_assets/189d642c-c7da-40aa-bffd-517aa0eb7999/asset_download_148430456220170113-20961-67b7r0"
          }
        }]
      }
    }
  end
end
