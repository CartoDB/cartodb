require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    create_table :connections do
      Uuid :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :user_id, :users, type: :uuid, null: false, on_delete: :cascade
      String :type, null: false
      String :connector, null: false
      String :name, null: false
      String :parameters, null: true, type: 'json'
      String :token, null: true
      DateTime :created_at, null: false
      DateTime :updated_at, null: false
      index [:user_id], unique: true
    end
  end,
  proc do
    drop_table :connections
  end
)
