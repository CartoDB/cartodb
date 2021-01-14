require 'carto/db/migration_helper'

# rubocop:disable Style/MixinUsage
include Carto::Db::MigrationHelper
# rubocop:enable Style/MixinUsage

migration(
  proc do
    create_table :user_map_views do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, index: true, on_delete: :cascade
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
      Date        :metric_date, null: false
      Integer     :map_views
      index [:user_id, :metric_date], unique: true
    end
  end,
  proc do
    drop_table :user_map_views
  end
)
