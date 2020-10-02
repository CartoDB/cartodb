require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :frontend_version, :text
    add_column :users, :asset_host, :text
  end,
  proc do
    drop_column :users, :frontend_version
    drop_column :users, :asset_host
  end
)
