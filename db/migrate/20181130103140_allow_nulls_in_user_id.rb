require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    alter_table :oauth_apps do
      set_column_allow_null :user_id
    end
  end,
  proc do
    alter_table :oauth_apps do
      set_column_not_null :user_id
    end
  end
)
