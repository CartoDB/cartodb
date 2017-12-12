require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :api_keys do
      Uuid        :id, primary_key: true, default: 'uuid_generate_v4()'.lit
      String      :token, null: false
      foreign_key :user_id, :users, type: :uuid, on_delete: :cascade, null: false
      String      :api_type, null: false
      String      :name
      String      :grants_json, type: 'json'
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
    end

    alter_table :api_keys do
      add_index [:token]
    end
  end,
  Proc.new do
    drop_table :api_keys
  end
)
