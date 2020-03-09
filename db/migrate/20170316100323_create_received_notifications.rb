require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :received_notifications do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, null: false, type: :uuid, on_delete: :cascade
      foreign_key :notification_id, :notifications, null: false, type: :uuid, on_delete: :cascade
      DateTime    :received_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :read_at
    end

    alter_table :received_notifications do
      add_index [:notification_id]
      add_index [:user_id]
    end
  end,
  Proc.new do
    drop_table :received_notifications
  end
)
