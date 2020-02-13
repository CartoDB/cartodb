require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :organizations, :inherit_owner_ffs, :boolean, null: false, default: false
  end,
  Proc.new do
    drop_column :organizations, :inherit_owner_ffs
  end
)
