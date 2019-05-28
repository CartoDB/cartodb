require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :oauth_app_organizations do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :oauth_app_id, :oauth_apps, type: :uuid, null: false, index: true, on_delete: :cascade
      foreign_key :organization_id, :organizations, type: :uuid, null: false, index: true, on_delete: :cascade
      Integer     :seats, null: false
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end

    add_column :oauth_apps, :restricted, :boolean, null: false, default: false
  end,
  Proc.new do
    drop_column :oauth_apps, :restricted

    drop_table :oauth_app_organizations
  end
)
