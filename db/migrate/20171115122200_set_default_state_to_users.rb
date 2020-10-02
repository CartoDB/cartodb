require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    set_column_default :users, :state, 'active'
    run "UPDATE users SET state = 'active';"
  end,
  proc do
    run 'ALTER TABLE users ALTER COLUMN state DROP DEFAULT;'
  end
)
