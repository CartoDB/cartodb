require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :last_name, :text
  end,
  proc do
    drop_column :users, :last_name
  end
)
