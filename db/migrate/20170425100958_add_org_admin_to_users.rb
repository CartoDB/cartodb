require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :org_admin, :boolean, null: false, default: false
  end,
  proc do
    drop_column :users, :org_admin
  end
)
