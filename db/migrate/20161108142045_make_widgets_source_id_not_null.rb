require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    alter_table :widgets do
      set_column_not_null :source_id
    end
  end,
  proc do
    alter_table :widgets do
      set_column_allow_null :source_id
    end
  end
)
