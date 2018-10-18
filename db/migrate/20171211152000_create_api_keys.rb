require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :api_keys do
      Uuid        :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      String      :token, null: false
      foreign_key :user_id, :users, type: :uuid, on_delete: :cascade, null: false
      String      :type, null: false
      String      :name, null: false
      String      :db_role, null: false
      String      :db_password, null: false
      String      :grants, type: 'json'
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
    end

    alter_table :api_keys do
      add_index :token, unique: true
      add_index :db_role, unique: true
      add_index :user_id
    end
  end,
  Proc.new do
    drop_table :api_keys
  end
)
