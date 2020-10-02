require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :data_imports, :collision_strategy, :text
  end,
  proc do
    drop_column :data_imports, :collision_strategy
  end
)
