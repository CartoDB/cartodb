require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :legends, :conf, :json, null: false, default: '{}'
  end,
  proc do
    drop_column :legends, :conf
  end
)
