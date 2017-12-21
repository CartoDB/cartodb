require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :org_admin, :boolean, null: false, default: false
  end,
  Proc.new do
    drop_column :users, :org_admin
  end
)
