require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :maintenance_mode, :boolean, null: false, default: false
  end,
  Proc.new do
    drop_column :users, :maintenance_mode
  end
)
