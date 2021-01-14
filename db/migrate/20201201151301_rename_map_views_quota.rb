require 'carto/db/migration_helper'

# rubocop:disable Style/MixinUsage
include Carto::Db::MigrationHelper
# rubocop:enable Style/MixinUsage

migration(
  proc do
    rename_column :users, :map_view_quota, :map_views_quota
    rename_column :organizations, :map_view_quota, :map_views_quota
  end,
  proc do
    rename_column :users, :map_views_quota, :map_view_quota
    rename_column :organizations, :map_views_quota, :map_view_quota
  end
)
