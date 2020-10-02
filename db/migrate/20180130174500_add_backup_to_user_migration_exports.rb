require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :user_migration_exports, :backup, :boolean, default: false, null: false
  end,
  proc do
    drop_column :user_migration_exports, :backup
  end
)
