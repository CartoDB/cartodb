require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :visualization_backups do
      Uuid      :id,                primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, on_delete: :cascade
      foreign_key :visualization_id, :visualizations, type: :uuid, null: false
      DateTime  :created_at,        default: Sequel::CURRENT_TIMESTAMP
      String    :category,          null: false
      json      :export,            null: false
    end
  end,
  Proc.new do
    drop_table :visualization_backups
  end
)

