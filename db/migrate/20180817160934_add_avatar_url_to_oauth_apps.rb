require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :oauth_apps, :icon_url, :text, null: false
  end,
  Proc.new do
    drop_column :oauth_apps, :icon_url
  end
)
