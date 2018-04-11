require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    create_table :account_types do
      String      :account_type, primary_key: true
      foreign_key :rate_limit_id, :rate_limits, type: :uuid, on_delete: :restrict, null: false
      DateTime    :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      DateTime    :updated_at, null: false, default: Sequel::CURRENT_TIMESTAMP
    end
  end,
  Proc.new do
    drop_table :account_types
  end
)
