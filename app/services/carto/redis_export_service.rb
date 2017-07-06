require 'json'

# Version History
# 1.0.0: export organization metadata
module Carto
  module RedisExportServiceConfiguration
    CURRENT_VERSION = '1.0.0'.freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module RedisExportServiceImporter
    include RedisExportServiceConfiguration

    def restore_redis_from_json_export(exported_json_string)
      restore_redis_from_hash_export(JSON.parse(exported_json_string).deep_symbolize_keys)
    end

    def restore_redis_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      restore_redis(exported_hash[:redis])
    end

    private

    def restore_redis(redis_export)
      restore_keys($users_metadata, redis_export[:users_metadata])
    end

    def restore_keys(redis_db, redis_keys)
      redis_keys.each do |key, value|
        redis_db.restore(key, value[:ttl], Base64.decode64(value[:value]))
      end
    end
  end

  module RedisExportServiceExporter
    include RedisExportServiceConfiguration

    def export_organization_json_string(organization_id)
      export_organization_json_hash(organization_id).to_json
    end

    def export_organization_json_hash(organization_id)
      {
        version: CURRENT_VERSION,
        redis: export_organization(Organization.find(organization_id))
      }
    end

    def export_user_json_string(user_id)
      export_user_json_hash(user_id).to_json
    end

    def export_user_json_hash(user_id)
      {
        version: CURRENT_VERSION,
        redis: export_user(User.find(user_id))
      }
    end

    private

    def export_organization(organization)
      {
        users_metadata: export_dataservices("org:#{organization.name}")
      }
    end

    def export_user(user)
      {
        users_metadata: export_dataservices("user:#{user.username}")
      }
    end

    def export_dataservices(prefix)
      $users_metadata.keys("#{prefix}:*").map { |key| export_key($users_metadata, key) }.reduce({}, &:merge)
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
