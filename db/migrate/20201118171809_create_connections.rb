require 'carto/db/migration_helper'

# rubocop:disable Style/MixinUsage
include Carto::Db::MigrationHelper
# rubocop:enable Style/MixinUsage

migration(
  proc do
    create_table :connections do
      Uuid :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, index: true, on_delete: :cascade
      String :connection_type, null: false
      String :connector, null: false
      String :name, null: false
      String :parameters, null: true, type: 'json'
      String :token, null: true
      DateTime :created_at, null: false
      DateTime :updated_at, null: false
    end
    run %{
      INSERT INTO connections(user_id, connection_type, connector, name, token, created_at, updated_at)
      SELECT user_id, 'oauth-service', service, service, token, created_at, updated_at
        FROM synchronization_oauths
        WHERE EXISTS (SELECT id FROM users WHERE id=synchronization_oauths.user_id);
    }
  end,
  proc do
    drop_table :connections
  end
)
