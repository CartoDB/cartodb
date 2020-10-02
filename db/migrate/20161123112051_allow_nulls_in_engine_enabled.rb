require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    alter_table :users do
      set_column_allow_null :engine_enabled
    end
  end,
  proc do
    alter_table :users do
      set_column_not_null :engine_enabled
    end
  end
)
