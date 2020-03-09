require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :oauth_refresh_tokens do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :oauth_app_user_id, :oauth_app_users, type: :uuid, null: false, index: true, on_delete: :cascade
      text        :token, null: false, index: true
      column      :scopes, 'text[]', null: false, default: Sequel.lit("'{}'")
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end
  end,
  Proc.new do
    drop_table :oauth_refresh_tokens
  end
)
