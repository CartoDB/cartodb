require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_index :account_types, [:rate_limit_id]
  end,
  proc do
    drop_index :account_types, [:rate_limit_id]
  end
)
