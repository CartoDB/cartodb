require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :organizations, :inherit_owner_ffs, :boolean, null: false, default: false
  end,
  proc do
    drop_column :organizations, :inherit_owner_ffs
  end
)
