require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :legends, :conf, :json, null: false, default: '{}'
  end,
  Proc.new do
    drop_column :legends, :conf
  end
)
