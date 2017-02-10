require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :data_imports, :collision_strategy, :text
  end,
  Proc.new do
    drop_column :data_imports, :collision_strategy
  end
)
