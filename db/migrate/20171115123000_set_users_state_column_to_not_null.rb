require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :users do
      set_column_not_null :state
    end
  end,
  Proc.new do
    alter_table :users do
      set_column_allow_null :state
    end
  end
)
