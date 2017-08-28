require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :user_frontend_version, :text
    add_column :users, :asset_host, :text
  end,
  Proc.new do
    drop_column :users, :user_frontend_version
    drop_column :users, :asset_host
  end
)
