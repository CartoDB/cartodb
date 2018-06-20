require 'json'
require_dependency 'carto/export/layer_exporter'
require_dependency 'carto/export/connector_configuration_exporter'

# Not migrated
# invitations -> temporary by nature
# ldap_configurations -> not enabled in SaaS

# Version History
# 1.0.0: export organization metadata
# 1.0.1: export password expiration
# 1.0.2: export connector configurations
module Carto
  module OrganizationMetadataExportServiceConfiguration
    CURRENT_VERSION = '1.0.2'.freeze
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
      :auth_saml_configuration, :no_map_logo, :password_expiration_in_d
    ].freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module OrganizationMetadataExportServiceImporter
    include OrganizationMetadataExportServiceConfiguration
    include LayerImporter
    include ConnectorConfigurationImporter

    def build_organization_from_json_export(exported_json_string)
      build_organization_from_hash_export(JSON.parse(exported_json_string, symbolize_names: true))
    end

    def build_organization_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      build_organization_from_hash(exported_hash[:organization])
    end

    private

    def save_imported_organization(organization)
      organization.save!
      ::Organization[organization.id].after_save
    end

    def build_organization_from_hash(exported_organization)
      organization = Organization.new(exported_organization.slice(*EXPORTED_ORGANIZATION_ATTRIBUTES))

      organization.assets = exported_organization[:assets].map { |asset| build_asset_from_hash(asset.symbolize_keys) }
      organization.groups = exported_organization[:groups].map { |group| build_group_from_hash(group.symbolize_keys) }
      organization.notifications = exported_organization[:notifications].map do |notification|
        build_notification_from_hash(notification.symbolize_keys)
      end

      organization.connector_configurations = build_connector_configurations_from_hash(
        exported_organization[:connector_configurations]
      )

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
      g = Group.new_instance_without_validation(
        name: exported_group[:name],
        display_name: exported_group[:display_name],
        database_role: exported_group[:database_role],
        auth_token: exported_group[:auth_token]
      )
      g.users_group = exported_group[:user_ids].map { |uid| UsersGroup.new(user_id: uid) }
      g.id = exported_group[:id]

      g
    end

    def build_notification_from_hash(notification)
      Notification.new(
        icon: notification[:icon],
        recipients: notification[:recipients],
        body: notification[:body],
        created_at: notification[:created_at],
        received_notifications: notification[:received_by].map do |received_notification|
          build_received_notification_from_hash(received_notification.symbolize_keys)
        end
      )
    end

    def build_received_notification_from_hash(received_notification)
      ReceivedNotification.new(
        user_id: received_notification[:user_id],
        received_at: received_notification[:received_at],
        read_at: received_notification[:read_at]
      )
    end
  end

  module OrganizationMetadataExportServiceExporter
    include OrganizationMetadataExportServiceConfiguration
    include LayerExporter
    include ConnectorConfigurationExporter

    def export_organization_json_string(organization)
      export_organization_json_hash(organization).to_json
    end

    def export_organization_json_hash(organization)
      {
        version: CURRENT_VERSION,
        organization: export(organization)
      }
    end

    private

    def export(organization)
      organization_hash = EXPORTED_ORGANIZATION_ATTRIBUTES.map { |att| [att, organization.attributes[att.to_s]] }.to_h

      organization_hash[:assets] = organization.assets.map { |a| export_asset(a) }
      organization_hash[:groups] = organization.groups.map { |g| export_group(g) }
      organization_hash[:notifications] = organization.notifications.map { |n| export_notification(n) }
      organization_hash[:connector_configurations] = organization.connector_configurations.map do |cc|
        export_connector_configuration(cc)
      end

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
        id: group.id,
        name: group.name,
        display_name: group.display_name,
        database_role: group.database_role,
        auth_token: group.auth_token,
        user_ids: group.users.map(&:id)
      }
    end

    def export_notification(notification)
      {
        icon: notification.icon,
        recipients: notification.recipients,
        body: notification.body,
        created_at: notification.created_at,
        received_by: notification.received_notifications.map { |rn| export_received_notification(rn) }
      }
    end

    def export_received_notification(received_notification)
      {
        user_id: received_notification.user_id,
        received_at: received_notification.received_at,
        read_at: received_notification.read_at
      }
    end
  end

  class OrganizationAlreadyExists < RuntimeError; end
  # Both String and Hash versions are provided because `deep_symbolize_keys` won't symbolize through arrays
  # and having separated methods make handling and testing much easier.
  class OrganizationMetadataExportService
    include OrganizationMetadataExportServiceImporter
    include OrganizationMetadataExportServiceExporter

    def export_to_directory(organization, path)
      root_dir = Pathname.new(path)

      # Export organization
      organization_json = export_organization_json_string(organization)
      root_dir.join("organization_#{organization.id}.json").open('w') { |file| file.write(organization_json) }

      redis_json = Carto::RedisExportService.new.export_organization_json_string(organization)
      root_dir.join("redis_organization_#{organization.id}.json").open('w') { |file| file.write(redis_json) }

      # Export users
      organization.users.each do |user|
        Carto::UserMetadataExportService.new.export_to_directory(user, root_dir.join("user_#{user.id}"))
      end
    end

    def import_from_directory(meta_path)
      # Import organization
      organization = load_organization_from_directory(meta_path)
      raise OrganizationAlreadyExists.new if ::Carto::Organization.exists?(id: organization.id)

      organization_redis_file = redis_filename(meta_path)
      Carto::RedisExportService.new.restore_redis_from_json_export(File.read(organization_redis_file))

      # Groups and notifications must be saved after users
      groups = organization.groups.dup
      organization.groups.clear
      notifications = organization.notifications.dup
      organization.notifications.clear

      save_imported_organization(organization)

      user_list = get_user_list(meta_path)

      # In order to get permissions right, we first import all users, then all datasets and finally, all maps
      organization.users = user_list.map do |user_path|
        Carto::UserMetadataExportService.new.import_from_directory(user_path)
      end

      organization.groups = groups
      organization.notifications = notifications
      organization.save

      organization
    end

    def rollback_import_from_directory(meta_path)
      organization_redis_file = redis_filename(meta_path)
      Carto::RedisExportService.new.remove_redis_from_json_export(File.read(organization_redis_file))
      organization = load_organization_from_directory(meta_path)

      user_list = organization.non_owner_users + [organization.owner]
      user_list.map do |user|
        Carto::UserMetadataExportService.new.rollback_import_from_directory("#{meta_path}/user_#{user.id}")
      end
      return unless Carto::Organization.exists?(organization.id)

      organization = Carto::Organization.find(organization.id)
      organization.groups.delete
      organization.notifications.delete
      organization.assets.map(&:delete)
      organization.users.delete
      organization.delete
    end

    def get_user_list(meta_path)
      Dir["#{meta_path}/user_*"]
    end

    def redis_filename(meta_path)
      Dir["#{meta_path}/redis_organization_*.json"].first
    end

    def load_organization_from_directory(meta_path)
      organization_file = Dir["#{meta_path}/organization_*.json"].first
      build_organization_from_json_export(File.read(organization_file))
    end

    def import_metadata_from_directory(organization, path)
      organization.users.each do |user|
        Carto::UserMetadataExportService.new.import_user_visualizations_from_directory(
          user, Carto::Visualization::TYPE_REMOTE, "#{path}/user_#{user.id}"
        )

        Carto::UserMetadataExportService.new.import_user_visualizations_from_directory(
          user, Carto::Visualization::TYPE_CANONICAL, "#{path}/user_#{user.id}"
        )
      end

      # Derived must be the last because of shared canonicals
      organization.users.each do |user|
        Carto::UserMetadataExportService.new.import_user_visualizations_from_directory(
          user, Carto::Visualization::TYPE_DERIVED, "#{path}/user_#{user.id}"
        )
      end

      organization.users.each do |user|
        Carto::UserMetadataExportService.new.import_search_tweets_from_directory(user, "#{path}/user_#{user.id}")
      end

      organization
    end
  end
end
