require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    run "UPDATE users SET industry = 'Transportation and Logistics' WHERE industry = 'Transport and Logistics'"
  end,
  proc do
  end
)
