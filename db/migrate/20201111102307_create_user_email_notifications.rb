require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    create_table :user_email_notifications do
      Uuid :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, on_delete: :cascade
      String :notification, null: false
      Boolean :enabled
      DateTime :created_at, null: false
      DateTime :updated_at, null: false
      index [:user_id, :notification], unique: true
    end
  end,
  proc do
    drop_table :user_email_notifications
  end
)
