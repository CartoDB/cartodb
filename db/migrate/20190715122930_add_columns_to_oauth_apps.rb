require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :oauth_apps, :description, String, null: true
    add_column :oauth_apps, :website_url, String, null: true
  end,
  proc do
    drop_column :oauth_apps, :description
    drop_column :oauth_apps, :website_url
  end
)
