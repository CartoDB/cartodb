require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table(:connections) do
      set_column_not_null :global_name
    end
  end,
  Proc.new do
    alter_table(:connections) do
      set_column_allow_null :global_name
    end
  end
)
