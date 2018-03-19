require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_index :account_types, [:rate_limit_id]
  end,
  Proc.new do
    drop_index :account_types, [:rate_limit_id]
  end
)
