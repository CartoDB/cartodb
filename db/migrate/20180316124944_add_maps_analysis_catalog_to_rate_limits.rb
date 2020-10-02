require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  proc do
    add_column :rate_limits, :maps_analysis_catalog, 'integer[]'
  end,
  proc do
    drop_column :rate_limits, :maps_analysis_catalog
  end
)
