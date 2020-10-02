require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :users, :password_reset_token, String, null: true
    add_column :users, :password_reset_sent_at, DateTime, null: true
  end,
  proc do
    drop_column :users, :password_reset_token
    drop_column :users, :password_reset_sent_at
  end
)
