require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :session_salt, String, null: true
  end,
  Proc.new do
    drop_column :users, :session_salt
  end
)
