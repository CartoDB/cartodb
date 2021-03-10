require 'carto/db/migration_helper'

# rubocop:disable Style/MixinUsage
include Carto::Db::MigrationHelper
# rubocop:enable Style/MixinUsage

migration(
  proc do
    create_table :auth_codes do |t|
      Uuid :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, index: true, on_delete: :cascade
      String :code,                 null: false
    end
  end,
  proc do
    drop_table :auth_codes
  end
)
