require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :public_dataset_quota, Integer, null: true
  end,
  Proc.new do
    drop_column :users, :public_dataset_quota
  end
)