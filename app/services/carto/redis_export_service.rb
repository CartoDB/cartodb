require 'json'

# Version History
# 1.0.0: export organization metadata
# 1.0.1: add DO subscriptions
module Carto
  module RedisExportServiceConfiguration

    CURRENT_VERSION = '1.0.1'.freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module RedisExportServiceImporter
    include RedisExportServiceConfiguration

    def restore_redis_from_json_export(exported_json_string)
      restore_redis_from_hash_export(JSON.parse(exported_json_string).deep_symbolize_keys)
    end

    def remove_redis_from_json_export(exported_json_string)
      remove_redis_from_hash_export(JSON.parse(exported_json_string).deep_symbolize_keys)
    end

    def restore_redis_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      restore_redis(exported_hash[:redis])
    end

    def remove_redis_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      remove_redis(exported_hash[:redis])
    end

    def restore_redis_do_subscriptions_from_json_export(exported_json_string, user)
      exported_hash = JSON.parse(exported_json_string).deep_symbolize_keys
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      restore_do_subscriptions($users_metadata, exported_hash[:redis][:do_subscriptions], user)
    end

    private

    def restore_redis(redis_export)
      restore_keys($users_metadata, redis_export[:users_metadata])
      restore_named_maps($tables_metadata, redis_export[:tables_metadata])
    end

    def remove_redis(redis_export)
      remove_keys($users_metadata, redis_export[:users_metadata])
      remove_keys($tables_metadata, redis_export[:tables_metadata])
      remove_keys($users_metadata, redis_export[:do_subscriptions])
    end

    def restore_keys(redis_db, redis_keys)
      redis_keys.each do |key, value|
        redis_db.restore(key, value[:ttl], Base64.decode64(value[:value]))
      end
    end

    def restore_named_maps(redis_db, redis_keys)
      redis_keys.select { |k| k =~ /map_tpl\|/ }.each do |key, value|
        value.each do |name, named_map_config|
          redis_db.hset(key, name, Base64.decode64(named_map_config))
        end
      end
    end

    def restore_do_subscriptions(redis_db, redis_keys, user)
      redis_keys.each do |key, value|
        subscriptions = JSON.parse(value.presence || '[]')

        subscriptions.each do |sub|
          dataset = user.tables.find_by(name: sub['sync_table'])
          next if dataset.nil?

          sub['sync_table_id'] = dataset.id
          sub['synchronization_id'] = dataset.synchronization.try(:id)
        end

        redis_db.hset(key, Carto::DoLicensingService::PRESELECTED_STORAGE, subscriptions.to_json)
      end
    end

    def remove_keys(redis_db, redis_keys)
      redis_keys.each do |key|
        redis_db.del(key)
      end
    end
  end

  module RedisExportServiceExporter
    include RedisExportServiceConfiguration

    def export_organization_json_string(organization)
      export_organization_json_hash(organization).to_json
    end

    def export_organization_json_hash(organization)
      {
        version: CURRENT_VERSION,
        redis: export_organization(organization)
      }
    end

    def export_user_json_string(user)
      export_user_json_hash(user).to_json
    end

    def export_user_json_hash(user)
      {
        version: CURRENT_VERSION,
        redis: export_user(user)
      }
    end

    private

    def export_organization(organization)
      {
        users_metadata: export_dataservices("org:#{organization.name}"),
        tables_metadata: {},
        do_subscriptions: {}
      }
    end

    def export_user(user)
      {
        users_metadata: export_dataservices("user:#{user.username}"),
        tables_metadata: export_named_maps(user),
        do_subscriptions: export_do_subscriptions(user)
      }
    end

    def export_dataservices(prefix)
      $users_metadata_secondary.keys("#{prefix}:*").map { |key|
        export_key($users_metadata_secondary, key)
      }.reduce({}, &:merge)
    end

    def export_named_maps(user)
      named_maps_key = "map_tpl|#{user.username}"
      named_maps_keys = $tables_metadata_secondary.hkeys(named_maps_key).reject do |named_map|
        matches_user_visualization?(named_map, user)
      end
      named_maps_hash = named_maps_keys.reduce({}) do |m, named_map|
        m.merge(named_map => Base64.encode64($tables_metadata_secondary.hget(named_maps_key, named_map)))
      end
      return {} unless named_maps_hash.any?
      { named_maps_key => named_maps_hash }
    end

    def export_do_subscriptions(user)
      do_subscriptions_key = "do:#{user.username}:datasets"
      do_subscriptions =
        $users_metadata.hget(do_subscriptions_key, Carto::DoLicensingService::PRESELECTED_STORAGE)
      return {} if do_subscriptions.nil?

      {
        do_subscriptions_key => do_subscriptions
      }
    end

    def matches_user_visualization?(named_map, user)
      re = /tpl_(?<viz_id>.+)/
      match = re.match(named_map)
      match && visualization_exists?(id: match[:viz_id].tr('_', '-'), user_id: user.id)
    end

    def visualization_exists?(criteria)
      Carto::Visualization.where(criteria).exists?
    rescue StandardError
      false
    end

    def export_key(redis_db, key)
      {
        key => {
          ttl: [0, redis_db.pttl(key)].max, # PTTL returns -1 if not set, clamp to 0
          value: Base64.encode64(redis_db.dump(key))
        }
      }
    end
  end

  # Both String and Hash versions are provided because `deep_symbolize_keys` won't symbolize through arrays
  # and having separated methods make handling and testing much easier.
  class RedisExportService
    include RedisExportServiceImporter
    include RedisExportServiceExporter
  end
end
