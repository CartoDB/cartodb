require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :oauth_apps do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, index: true, on_delete: :restrict
      String      :name, null: false
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      # Oauth parameters
      String      :client_id, unique: true, null: false
      String      :client_secret, null: false
      column      :redirect_uris, 'text[]', null: false
    end
  end,
  Proc.new do
    drop_table :oauth_apps
  end
)
