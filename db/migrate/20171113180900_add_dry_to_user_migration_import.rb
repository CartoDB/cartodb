require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :user_migration_imports, :dry, :boolean, default: false
  end,
  proc do
    drop_column :user_migration_imports, :dry
  end
)
