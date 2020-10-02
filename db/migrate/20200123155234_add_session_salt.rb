require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :session_salt, String
    add_column :user_creations, :session_salt, String
  end,
  proc do
    drop_column :users, :session_salt
    drop_column :user_creations, :session_salt
  end
)
