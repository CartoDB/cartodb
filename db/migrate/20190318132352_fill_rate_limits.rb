require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    run "UPDATE rate_limits SET sql_copy_from = '{3,3,60}' WHERE sql_copy_from IS NULL"
    run "UPDATE rate_limits SET sql_copy_to = '{3,3,60}' WHERE sql_copy_to IS NULL"
  end,
  Proc.new do
  end
)
