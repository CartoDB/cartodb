require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :oauth_apps do
      set_column_allow_null :icon_url
    end
  end,
  Proc.new do
    alter_table :oauth_apps do
      set_column_not_null :icon_url
    end
  end
)
