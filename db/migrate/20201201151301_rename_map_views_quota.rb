require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    rename_column :users, :map_view_quota, :map_views_quota
    rename_column :organizations, :map_view_quota, :map_views_quota
  end,
  Proc.new do
    rename_column :users, :map_views_quota, :map_view_quota
    rename_column :organizations, :map_views_quota, :map_view_quota
  end
)
