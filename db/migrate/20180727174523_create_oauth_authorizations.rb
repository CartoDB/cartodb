require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :oauth_authorizations do
      Uuid        :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      foreign_key :oauth_app_user_id, :oauth_app_users, type: :uuid, null: false, index: true, on_delete: :cascade
      foreign_key :api_key_id, :api_keys, type: :uuid, null: true, on_delete: :restrict,
                                          index: { where: 'api_key_id IS NOT NULL', unique: true }
      column      :scopes, 'text[]', null: false, default: "'{}'".lit
      String      :code, null: true, index: { where: 'code IS NOT NULL' }
      String      :redirect_uri, null: true
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end
  end,
  Proc.new do
    drop_table :oauth_authorizations
  end
)
