require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :maintenance_mode, :boolean, null: false, default: false
  end,
  proc do
    drop_column :users, :maintenance_mode
  end
)
