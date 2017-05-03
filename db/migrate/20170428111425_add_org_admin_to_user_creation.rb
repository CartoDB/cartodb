require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :user_creations, :org_admin, :boolean, null: false, default: false
  end,
  Proc.new do
    drop_column :user_creations, :org_admin
  end
)
