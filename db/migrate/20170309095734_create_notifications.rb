require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    create_table :notifications do
      Uuid        :id, primary_key: true, default: Sequel.lit('uuid_generate_v4()')
      foreign_key :organization_id, :organizations, type: :uuid, on_delete: :cascade
      String      :icon, null: false
      String      :recipients
      String      :body, null: false
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end

    alter_table :notifications do
      add_index [:organization_id]
    end
  end,
  proc do
    drop_table :notifications
  end
)
