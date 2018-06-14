require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :rate_limits, :sql_copy_from, "integer[]"
    add_column :rate_limits, :sql_copy_to, "integer[]"
  end,
  Proc.new do
    drop_column :rate_limits, :sql_copy_from
    drop_column :rate_limits, :sql_copy_to
  end
)
