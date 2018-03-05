require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :account_types do
      String      :account_type, null: false
      foreign_key :rate_limit_id, :rate_limits, type: :uuid, on_delete: :cascade, null: false
      DateTime    :created_at, null: false
      DateTime    :updated_at, null: false
    end

    alter_table :account_types do
      add_index :account_type, unique: true
    end
  end,
  Proc.new do
    drop_table :account_types
  end
)
