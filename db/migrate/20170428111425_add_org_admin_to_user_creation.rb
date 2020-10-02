require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :user_creations, :org_admin, :boolean, null: false, default: false
  end,
  proc do
    drop_column :user_creations, :org_admin
  end
)
