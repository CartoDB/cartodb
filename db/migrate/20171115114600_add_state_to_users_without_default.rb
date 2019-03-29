require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :state, :text
  end,
  Proc.new do
    drop_column :users, :state
  end
)
