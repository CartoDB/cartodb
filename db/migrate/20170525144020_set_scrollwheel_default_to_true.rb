require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    set_column_default :maps, :scrollwheel, true
  end,
  proc do
    set_column_default :maps, :scrollwheel, false
  end
)
