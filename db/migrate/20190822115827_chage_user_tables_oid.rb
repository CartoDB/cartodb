require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    alter_table :user_tables do
      set_column_type :table_id, :oid
    end
  end,
  proc do
    alter_table :user_tables do
      set_column_type :table_id, Integer
    end
  end
)
