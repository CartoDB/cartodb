require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table(:users) do
      set_column_default :salt, ''
    end
    alter_table(:user_creations) do
      set_column_default :salt, ''
    end
  end,
  Proc.new do
    alter_table(:users) do
      set_column_default :salt, nil
    end
    alter_table(:user_creations) do
      set_column_default :salt, nil
    end
  end
)
