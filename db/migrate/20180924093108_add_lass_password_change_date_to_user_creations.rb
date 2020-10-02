require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :user_creations, :last_password_change_date, DateTime, null: true
  end,
  proc do
    drop_column :user_creations, :last_password_change_date
  end
)
