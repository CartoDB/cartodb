require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :private_map_quota, Integer, null: true
  end,
  Proc.new do
    drop_column :users, :private_map_quota
  end
)
