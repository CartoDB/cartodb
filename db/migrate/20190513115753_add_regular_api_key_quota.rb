require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :regular_api_key_quota, Integer, null: true
  end,
  Proc.new do
    drop_column :users, :regular_api_key_quota
  end
)
