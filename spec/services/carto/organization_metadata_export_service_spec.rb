require 'spec_helper_min'
require 'factories/carto_visualizations'
require './spec/support/factories/organizations'

describe Carto::OrganizationMetadataExportService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations
  include CartoDB::Factories

  let!(:organization) { create_organization_with_users }
  let(:owner) { organization.owner }
  let(:non_owner) { organization.users.reject(&:organization_owner?).first }
  let!(:asset) { create(:organization_asset, organization: organization) }
  let!(:group) do
    group = create(:carto_group, organization: organization)
    group.add_user(non_owner.username)
    group
  end
  let!(:notification) do
    notification = create(:notification, organization: organization)
    notification.received_notifications.find_by_user_id(owner.id).update_attribute(:read_at, DateTime.now)
    notification
  end
  let(:table_visualization) { create_full_visualization(non_owner)[2] }
  let!(:connector_provider) { create(:connector_provider) }
  let(:user) { create(:carto_user) }
  let!(:oauth_app) { create(:oauth_app, user: user) }

  def destroy_organization
    clean_redis
    organization.groups.each(&:destroy)
    organization.groups.clear
    organization.reload.destroy_cascade
  end

  def clean_redis
    gum = CartoDB::GeocoderUsageMetrics.new(owner.username, organization.name)
    $users_metadata.DEL(gum.send(:user_key_prefix, :geocoder_here, :success_responses, DateTime.now))
    $users_metadata.DEL(gum.send(:org_key_prefix, :geocoder_here, :success_responses, DateTime.now))
  end

  let(:service) { Carto::OrganizationMetadataExportService.new }

  describe '#organization export' do
    before do
      share_visualization_with_user(table_visualization, owner)
      CartoDB::GeocoderUsageMetrics.new(owner.username, organization.name).incr(:geocoder_here, :success_responses)
      create(:connector_configuration, connector_provider: connector_provider, organization: organization)
    end

    it 'exports' do
      export = service.export_organization_json_hash(organization)

      expect_export_matches_organization(export[:organization], organization)
    end

    it 'includes all user model attributes' do
      export = service.export_organization_json_hash(organization)
      # TODO: remove once columns are dropped from DB
      deprecated_data_observatory_v1_attributes = [
        :obs_snapshot_quota,
        :obs_snapshot_block_price,
        :soft_obs_snapshot_limit,
        :obs_general_quota,
        :obs_general_block_price,
        :soft_obs_general_limit
      ]

      expect(export[:organization].keys).to(
        include(*organization.attributes.symbolize_keys.keys - deprecated_data_observatory_v1_attributes)
      )
    end

    it 'exports notifications and received notifications' do
      export = service.export_organization_json_hash(organization)

      exported_notifications = export[:organization][:notifications]
      exported_notifications.length.should eq 1
      exported_notifications.first[:received_by].length.should eq organization.users.length
    end
  end

  describe '#organization import' do
    it 'imports' do
      organization = service.build_organization_from_hash_export(full_export)

      expect_export_matches_organization(full_export[:organization], organization)
    end

    it 'imports 1.0.2 (without oauth_app_organizations)' do
      organization = service.build_organization_from_hash_export(full_export_one_zero_two)

      expect_export_matches_organization(full_export_one_zero_two[:organization], organization)
      expect(organization.oauth_app_organizations).to be_empty
    end

    it 'imports 1.0.1 (without connector configurations)' do
      organization = service.build_organization_from_hash_export(full_export_one_zero_one)

      expect_export_matches_organization(full_export_one_zero_one[:organization], organization)
      expect(organization.connector_configurations).to be_empty
    end

    it 'imports 1.0.0 (without password expiration)' do
      organization = service.build_organization_from_hash_export(full_export_one_zero_zero)

      expect_export_matches_organization(full_export_one_zero_zero[:organization], organization)
      expect(organization.password_expiration_in_d).to be_nil
    end
  end

  describe '#full export + import (organization, users and visualizations)' do
    it 'export + import organization, users and visualizations' do
      Dir.mktmpdir do |path|
        share_visualization_with_user(table_visualization, owner)
        CartoDB::GeocoderUsageMetrics.new(owner.username, organization.name).incr(:geocoder_here, :success_responses)
        create(:connector_configuration, connector_provider: connector_provider, organization: organization)

        organization.reload
        service.export_to_directory(organization, path)
        source_organization = organization.attributes
        source_users = organization.users.order(username: :asc).map(&:attributes)
        source_groups = organization.groups.map(&:attributes)
        source_group_users = group.users.map(&:id)
        source_assets = organization.assets.map(&:attributes)
        expect(source_assets).not_to be_empty
        source_notifications = organization.notifications.map(&:attributes)
        source_received_notifications = organization.notifications.map { |n|
          [n.id, n.received_notifications.map(&:attributes)]
        }.to_h

        # Destroy, keeping the database
        clean_redis
        Table.any_instance.stubs(:remove_table_from_user_database)
        organization.notifications.each(&:destroy)
        organization.assets.each { |a| a.update_attribute(:storage_info, nil) } # Avoids remote deletion attempt
        organization.assets.each(&:delete)
        organization.assets.clear
        organization.users.flat_map(&:visualizations).each(&:destroy)
        organization.users.each do |u|
          sequel_user = ::User[u.id]
          sequel_user.client_application.access_tokens.each(&:destroy)
          sequel_user.client_application.destroy
          u.destroy
        end
        organization.groups.each(&:destroy)
        organization.groups.clear
        organization.destroy

        imported_organization = service.import_from_directory(path)
        service.import_metadata_from_directory(imported_organization, path)
        imported_organization.reload

        compare_excluding_dates(imported_organization.attributes, source_organization)

        expect(imported_organization.users.count).to eq source_users.count
        imported_organization.users.order(username: :asc).zip(source_users).each do |u1, u2|
          compare_excluding_dates(u1.attributes, u2)
        end

        expect(imported_organization.groups.count).to eq source_groups.count
        expect_redis_restored(imported_organization)
        imported_organization.groups.zip(source_groups).each do |g1, g2|
          compare_excluding_fields(g1.attributes, g2, EXCLUDED_ORG_META_DATE_FIELDS + EXCLUDED_ORG_META_ID_FIELDS)
        end
        expect(imported_organization.groups.first.users.map(&:id)).to eq source_group_users

        expect(imported_organization.assets.length).to eq source_assets.length
        imported_organization.assets.zip(source_assets).each do |ia, sa|
          compare_excluding_fields(ia.attributes, sa, EXCLUDED_ASSETS_FIELDS)
        end

        expect(imported_organization.notifications.length).to eq source_notifications.length
        imported_organization.notifications.zip(source_notifications).each do |i_n, s_n|
          compare_excluding_fields(
            stringify_fields(i_n.attributes, ['created_at']),
            stringify_fields(s_n, ['created_at']),
            EXCLUDED_NOTIFICATIONS_FIELDS
          )
          i_received = i_n.received_notifications.map(&:attributes)
          s_received = source_received_notifications[s_n['id']]

          i_received.length.should eq s_received.length

          i_received.zip(s_received).each do |i_rn, s_rn|
            compare_excluding_fields(
              stringify_fields(i_rn, ['received_at', 'read_at']),
              stringify_fields(s_rn, ['received_at', 'read_at']),
              ['id', 'notification_id']
            )
          end
        end
      end
    end
  end

  EXCLUDED_ORG_META_DATE_FIELDS = ['created_at', 'updated_at', 'period_end_date'].freeze
  EXCLUDED_ORG_META_ID_FIELDS = ['id', 'organization_id'].freeze
  EXCLUDED_NOTIFICATIONS_FIELDS = ['id'].freeze
  EXCLUDED_ASSETS_FIELDS = ['id'].freeze

  # DateTime comparisons fail if they're not stringified
  def stringify_fields(hash, fields)
    hash.merge(Hash[hash.slice(*fields).map { |k, v| [k, v.to_s] }])
  end

  def compare_excluding_dates(u1, u2)
    compare_excluding_fields(u1, u2, EXCLUDED_ORG_META_DATE_FIELDS)
  end

  def compare_excluding_fields(u1, u2, fields)
    filtered1 = u1.reject { |k, _| fields.include?(k) }
    filtered2 = u2.reject { |k, _| fields.include?(k) }
    expect(filtered1).to eq filtered2
  end

  def expect_export_matches_organization(export, organization)
    Carto::OrganizationMetadataExportService::EXPORTED_ORGANIZATION_ATTRIBUTES.each do |att|
      expect(export[att]).to eq organization.attributes[att.to_s]
    end

    expect(export[:assets].count).to eq organization.assets.size
    export[:assets].zip(organization.assets).each do |exported_asset, asset|
      expect_export_matches_asset(exported_asset, asset)
    end

    expect(export[:groups].count).to eq organization.groups.size
    export[:groups].zip(organization.groups).each do |exported_group, group|
      expect_export_matches_group(exported_group, group)
    end

    expect(export[:notifications].count).to eq organization.notifications.size
    export[:notifications].zip(organization.notifications).each do |exported_notification, notification|
      expect_export_matches_notification(exported_notification, notification)
    end

    if export[:connector_configurations]
      expect(export[:connector_configurations].count).to eq organization.connector_configurations.size
      export[:connector_configurations].zip(organization.connector_configurations).each do |exported_cc, cc|
        expect_export_matches_connector_configuration(exported_cc, cc)
      end
    else
      expect(organization.connector_configurations).to be_empty
    end

    if export[:oauth_app_organizations]
      expect(export[:oauth_app_organizations].count).to eq organization.oauth_app_organizations.size
      export[:oauth_app_organizations].zip(organization.oauth_app_organizations).each do |exported_oao, oao|
        expect_export_matches_oauth_app_organization(exported_oao, oao)
      end
    else
      expect(organization.oauth_app_organizations).to be_empty
    end
  end

  def expect_export_matches_asset(exported_asset, asset)
    expect(exported_asset[:public_url]).to eq asset.public_url
    expect(exported_asset[:kind]).to eq asset.kind
    expect(exported_asset[:storage_info]).to eq asset.storage_info
  end

  def expect_export_matches_group(exported_group, group)
    expect(exported_group[:id]).to eq group.id
    expect(exported_group[:name]).to eq group.name
    expect(exported_group[:display_name]).to eq group.display_name
    expect(exported_group[:database_role]).to eq group.database_role
    expect(exported_group[:auth_token]).to eq group.auth_token
  end

  def expect_export_matches_notification(exported_notification, notification)
    expect(exported_notification[:icon]).to eq notification.icon
    expect(exported_notification[:recipients]).to eq notification.recipients
    expect(exported_notification[:body]).to eq notification.body
    expect(exported_notification[:created_at]).to eq notification.created_at
    # This check forces test data to have notification receptions, so they will be tested
    expect(exported_notification[:received_by].length).to be > 0
    expect(exported_notification[:received_by].length).to eq notification.received_notifications.length
    exported_notification[:received_by].each do |exported_received_notification|
      received_notification = notification.received_notifications.find do |rn|
        rn.user_id == exported_received_notification[:user_id]
      end
      expect(exported_received_notification[:received_at]).to eq received_notification.received_at
      expect(exported_received_notification[:read_at]).to eq received_notification.read_at
    end
  end

  def expect_export_matches_received_notification(exported_received_notification, received_notification)
    expect(exported_received_notification[:user_id]).to eq received_notification.user_id
    expect(exported_received_notification[:received_at]).to eq received_notification.received_at
    expect(exported_received_notification[:read_at]).to eq received_notification.read_at
  end

  def expect_export_matches_connector_configuration(exported_cc, cc)
    expect(exported_cc[:enabled]).to eq cc.enabled
    expect(exported_cc[:max_rows]).to eq cc.max_rows
    expect(exported_cc[:created_at]).to eq cc.created_at
    expect(exported_cc[:updated_at]).to eq cc.updated_at
    expect(exported_cc[:provider_name]).to eq cc.connector_provider.name
  end

  def expect_export_matches_oauth_app_organization(exported_oao, oao)
    expect(exported_oao[:oauth_app_id]).to eq oao.oauth_app_id
    expect(exported_oao[:seats]).to eq oao.seats
    expect(exported_oao[:oauth_app_id]).to eq oao.oauth_app_id
    expect(exported_oao[:oauth_app_id]).to eq oao.oauth_app_id

    fake_oao = Carto::OauthAppOrganization.new(
      created_at: exported_oao[:created_at],
      updated_at: exported_oao[:updated_at]
    )

    expect(fake_oao.created_at).to eq oao.created_at
    expect(fake_oao.updated_at).to eq oao.updated_at
  end

  def expect_redis_restored(org)
    expect(CartoDB::GeocoderUsageMetrics.new(org.owner.username, org.name).get(:geocoder_here, :success_responses)).to eq(1)
    expect(CartoDB::GeocoderUsageMetrics.new(org.owner.username).get(:geocoder_here, :success_responses)).to eq(1)
  end

  let(:full_export) do
    {
      version: "1.0.3",
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
        map_views_quota: nil,
        auth_token: "pgYcd8XnAn46HlczpvQcIw",
        geocoding_block_price: nil,
        map_view_block_price: nil,
        twitter_datasource_enabled: true,
        twitter_datasource_block_price: 100,
        twitter_datasource_block_size: 1000,
        twitter_datasource_quota: 1,
        google_maps_key: "key=AIzaEa12DxNYEyM257DwzuieArJ_pinDIPyYVts",
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
        random_saml_username: false,
        no_map_logo: false,
        password_expiration_in_d: 365,
        inherit_owner_ffs: false,
        assets: [{
          public_url: "http://localhost.lan:3000/uploads/organization_assets/189d642c-c7da-40aa-bffd-517aa0eb7999/asset_download_148430456220170113-20961-67b7r0",
          kind: "organization_asset",
          storage_info: {
            type: "local",
            location: "organization_assets",
            identifier: "public/uploads/organization_assets/189d642c-c7da-40aa-bffd-517aa0eb7999/asset_download_148430456220170113-20961-67b7r0"
          }
        }],
        groups: [
          {
            name: 'g_group',
            display_name: '#group',
            database_role: 'a98f3bc6391fadfe4d1487e2b6912d24_g_g_group',
            auth_token: 'TE7rg6_4RU8vAeTeEeITIQ',
            user_ids: []
          }
        ],
        notifications: [
          {
            icon: "alert",
            recipients: "all",
            body: "Empty body",
            created_at: DateTime.now,
            received_by: [
              {
                user_id: '06b974db-de0d-49b7-ae9b-76c63af8c122',
                received_at: DateTime.now,
                read_at: nil
              }
            ]
          }
        ],
        connector_configurations: [
          {
            created_at: DateTime.now,
            updated_at: DateTime.now,
            enabled: true,
            max_rows: 100000,
            provider_name: connector_provider.name
          }
        ],
        oauth_app_organizations: [
          {
            oauth_app_id: oauth_app.id,
            seats: 5,
            created_at: "2018-11-16T14:31:46+00:00",
            updated_at: "2018-11-17T16:41:56+00:00"
          }
        ]
      }
    }
  end

  let(:full_export_one_zero_two) do
    organizations_hash = full_export[:organization].except!(:oauth_app_organizations)
    full_export[:organization] = organizations_hash
    full_export
  end

  let(:full_export_one_zero_one) do
    organizations_hash = full_export_one_zero_two[:organization].except!(:connector_configurations)
    full_export[:organization] = organizations_hash
    full_export
  end

  let(:full_export_one_zero_zero) do
    organizations_hash = full_export_one_zero_one[:organization].except!(:password_expiration_in_d)
    full_export[:organization] = organizations_hash
    full_export
  end
end
