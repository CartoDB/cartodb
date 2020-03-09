require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :session_salt, String
    add_column :user_creations, :session_salt, String
  end,
  Proc.new do
    drop_column :users, :session_salt
    drop_column :user_creations, :session_salt
  end
)
