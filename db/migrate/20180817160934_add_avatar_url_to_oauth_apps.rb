require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :oauth_apps, :icon_url, :text, null: false
  end,
  proc do
    drop_column :oauth_apps, :icon_url
  end
)
