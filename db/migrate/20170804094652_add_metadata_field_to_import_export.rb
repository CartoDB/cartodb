require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :user_migration_exports, :export_metadata, :boolean, default: false, null: false
    add_column :user_migration_imports, :import_metadata, :boolean, default: false, null: false
  end,
  proc do
    drop_column :user_migration_imports, :import_metadata
    drop_column :user_migration_exports, :export_metadata
  end
)
