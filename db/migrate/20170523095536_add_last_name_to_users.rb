require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :last_name, :text
  end,
  Proc.new do
    drop_column :users, :last_name
  end
)
