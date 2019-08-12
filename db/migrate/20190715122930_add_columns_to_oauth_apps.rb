require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :oauth_apps, :description, String, null: true
    add_column :oauth_apps, :website_url, String, null: true
  end,
  Proc.new do
    drop_column :oauth_apps, :description
    drop_column :oauth_apps, :website_url
  end
)
