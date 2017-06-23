require 'json'

# Version History
# 1.0.0: export organization metadata
module Carto
  module OrganizationMetadataExportServiceConfiguration
    CURRENT_VERSION = '1.0.0'.freeze
    EXPORTED_ORGANIZATION_ATTRIBUTES = [
      :id, :seats, :quota_in_bytes, :created_at, :updated_at, :name, :avatar_url, :owner_id, :website, :description,
      :display_name, :discus_shortname, :twitter_username, :geocoding_quota, :map_view_quota, :auth_token,
      :geocoding_block_price, :map_view_block_price, :twitter_datasource_enabled, :twitter_datasource_block_price,
      :twitter_datasource_block_size, :twitter_datasource_quota, :google_maps_key, :google_maps_private_key, :color,
      :default_quota_in_bytes, :whitelisted_email_domains, :admin_email, :auth_username_password_enabled,
      :auth_google_enabled, :location, :here_isolines_quota, :here_isolines_block_price, :strong_passwords_enabled,
      :obs_snapshot_quota, :obs_snapshot_block_price, :obs_general_quota, :obs_general_block_price,
      :salesforce_datasource_enabled, :viewer_seats, :geocoder_provider, :isolines_provider, :routing_provider,
      :auth_github_enabled, :engine_enabled, :mapzen_routing_quota, :mapzen_routing_block_price, :builder_enabled,
      :auth_saml_configuration, :no_map_logo
    ].freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module OrganizationMetadataExportServiceImporter
    include OrganizationMetadataExportServiceConfiguration
    include LayerImporter

    def build_organization_from_json_export(exported_json_string)
      build_organization_from_hash_export(JSON.parse(exported_json_string).deep_symbolize_keys)
    end

    def build_organization_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      build_organization_from_hash(exported_hash[:organization])
    end

    def save_imported_organization(organization)
      organization.groups.each { |g| g.users_group.clear }
      organization.save!
      ::Organization[organization.id].after_save
    end

    private

    def build_organization_from_hash(exported_organization)
      organization = Organization.new(exported_organization.slice(*EXPORTED_ORGANIZATION_ATTRIBUTES))

      organization.assets = exported_organization[:assets].map { |asset| build_asset_from_hash(asset.symbolize_keys) }
      organization.groups = exported_organization[:groups].map { |group| build_group_from_hash(group.symbolize_keys) }

      # Must be the last one to avoid attribute assignments to try to run SQL
      organization.id = exported_organization[:id]
      organization
    end

    def build_asset_from_hash(exported_asset)
      Asset.new(
        public_url: exported_asset[:public_url],
        kind: exported_asset[:kind],
        storage_info: exported_asset[:storage_info]
      )
    end

    def build_group_from_hash(exported_group)
      Group.new(
        name: exported_group[:name],
        display_name: exported_group[:display_name],
        database_role: exported_group[:database_role],
        auth_token: exported_group[:auth_token],
        users_group: exported_group[:users].map { |uid| UsersGroup.new(user_id: uid) }
      )
    end
  end

  module OrganizationMetadataExportServiceExporter
    include OrganizationMetadataExportServiceConfiguration
    include LayerExporter

    def export_organization_json_string(organization_id)
      export_organization_json_hash(organization_id).to_json
    end

    def export_organization_json_hash(organization_id)
      {
        version: CURRENT_VERSION,
        organization: export(Organization.find(organization_id))
      }
    end

    private

    def export(organization)
      organization_hash = EXPORTED_ORGANIZATION_ATTRIBUTES.map { |att| [att, organization.attributes[att.to_s]] }.to_h

      organization_hash[:assets] = organization.assets.map { |a| export_asset(a) }
      organization_hash[:groups] = organization.groups.map { |g| export_group(g) }

      organization_hash
    end

    def export_asset(asset)
      {
        public_url: asset.public_url,
        kind: asset.kind,
        storage_info: asset.storage_info
      }
    end

    def export_group(group)
      {
        name: group.name,
        display_name: group.display_name,
        database_role: group.database_role,
        auth_token: group.auth_token,
        users: group.users.map(&:id)
      }
    end
  end

  # Both String and Hash versions are provided because `deep_symbolize_keys` won't symbolize through arrays
  # and having separated methods make handling and testing much easier.
  class OrganizationMetadataExportService
    include OrganizationMetadataExportServiceImporter
    include OrganizationMetadataExportServiceExporter

    def export_organization_to_directory(organization_id, path)
      organization = Carto::Organization.find(organization_id)
      root_dir = Pathname.new(path)

      # Export organization
      organization_json = export_organization_json_string(organization_id)
      root_dir.join("organization_#{organization_id}.json").open('w') { |file| file.write(organization_json) }

      # Export users
      organization.users.each do |user|
        user_path = root_dir.join("user_#{user.id}")
        Dir.mkdir(user_path)
        Carto::UserMetadataExportService.new.export_user_to_directory(user.id, user_path)
      end
    end

    def import_organization_and_users_from_directory(path)
      # Import organization
      organization_file = Dir["#{path}/organization_*.json"].first
      organization = build_organization_from_json_export(File.read(organization_file))

      # Groups must be saved after users
      groups = organization.groups.dup
      organization.groups.clear
      save_imported_organization(organization)

      user_list = Dir["#{path}/user_*"]

      # In order to get permissions right, we first import all users, then all datasets and finally, all maps
      organization.users = user_list.map do |user_path|
        Carto::UserMetadataExportService.new.import_user_from_directory(user_path, import_visualizations: false)
      end

      organization.groups = groups
      organization.save

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
  end
end
