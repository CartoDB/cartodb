require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :user_creations, :last_password_change_date, DateTime, null: true
  end,
  Proc.new do
    drop_column :user_creations, :last_password_change_date
  end
)
