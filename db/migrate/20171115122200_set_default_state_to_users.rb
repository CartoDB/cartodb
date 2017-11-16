require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    set_column_default :users, :state, 'active'
    run "UPDATE users SET state = 'active';"
  end,
  Proc.new do
    run 'ALTER TABLE users ALTER COLUMN state DROP DEFAULT;'
  end
)
