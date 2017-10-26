require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :state, :text, default: 'active', null: false
  end,
  Proc.new do
    drop_column :users, :state
  end
)
