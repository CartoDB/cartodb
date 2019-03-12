require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :oauth_app_users do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :oauth_app_id, :oauth_apps, type: :uuid, null: false, index: true, on_delete: :cascade
      foreign_key :user_id, :users, type: :uuid, null: false, index: true, on_delete: :cascade
      column      :scopes, 'text[]', null: false, default: Sequel.lit("'{}'")
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      unique      [:oauth_app_id, :user_id]
    end
  end,
  Proc.new do
    drop_table :oauth_app_users
  end
)
