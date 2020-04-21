require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    run "UPDATE users SET industry = 'Transportation and Logistics' WHERE industry = 'Transport and Logistics'"
  end,
  Proc.new do
  end
)
