require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :states do
      set_column_allow_null :user_id
    end
  end,
  Proc.new do
    # There might be nulls by now, and no obvious default.
    # Restore manually or remigrate whole db (with total data loss)
  end
)
