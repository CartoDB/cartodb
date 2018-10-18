# This migration does not include Carto::Db::MigrationHelper on purpose
# It creates index concurrently, and that needs to be done outside of a transaction

require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_index :geocodings, [:user_id, :created_at]
    add_index :layers_user_tables, [:layer_id]
    add_index :layers_user_tables, [:user_table_id, :layer_id]
    add_index :user_tables, [:user_id, :name]
  end,
  Proc.new do
    drop_index :geocodings, [:user_id, :created_at]
    drop_index :layers_user_tables, [:layer_id]
    drop_index :layers_user_tables, [:user_table_id, :layer_id]
    drop_index :user_tables, [:user_id, :name]
  end
)
