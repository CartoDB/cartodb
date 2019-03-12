require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :oauth_access_tokens do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :oauth_app_user_id, :oauth_app_users, type: :uuid, null: false, index: true, on_delete: :cascade
      foreign_key :api_key_id, :api_keys, type: :uuid, null: false, on_delete: :restrict,
                                          index: { unique: true }
      column      :scopes, 'text[]', null: false, default: Sequel.lit("'{}'")
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end

    create_table :oauth_authorization_codes do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :oauth_app_user_id, :oauth_app_users, type: :uuid, null: false, index: true, on_delete: :cascade
      column      :scopes, 'text[]', null: false, default: Sequel.lit("'{}'")
      String      :code, null: false, index: { unique: true }
      String      :redirect_uri, null: true
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end
  end,
  Proc.new do
    drop_table :oauth_access_tokens
    drop_table :oauth_authorization_codes
  end
)
