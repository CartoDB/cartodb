require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :rate_limits, :sql_copy_from, 'integer[]'
    add_column :rate_limits, :sql_copy_to, 'integer[]'
  end,
  proc do
    drop_column :rate_limits, :sql_copy_from
    drop_column :rate_limits, :sql_copy_to
  end
)
