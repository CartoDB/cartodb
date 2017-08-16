require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
    Proc.new do
      add_column :user_migration_imports, :import_type, :text
      run "UPDATE user_migration_imports SET import_type = 'user' WHERE user_id IS NOT NULL"
      run "UPDATE user_migration_imports SET import_type = 'organization' WHERE organization_id IS NOT NULL"
      run 'ALTER TABLE user_migration_imports ALTER import_type SET NOT NULL'
    end,
    Proc.new do
      drop_column :user_migration_imports, :import_type
    end
)
