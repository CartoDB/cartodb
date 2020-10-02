require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    set_column_default :organizations, :builder_enabled, true
    set_column_default :users, :builder_enabled, true
  end,
  proc do
    set_column_default :organizations, :builder_enabled, false
    set_column_default :users, :builder_enabled, false
  end
)
