require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :user_migration_imports, :dry, :boolean, default: false
  end,
  Proc.new do
    drop_column :user_migration_imports, :dry
  end
)
