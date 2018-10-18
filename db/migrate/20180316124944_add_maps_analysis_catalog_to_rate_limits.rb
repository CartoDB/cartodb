require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :rate_limits, :maps_analysis_catalog, "integer[]"
  end,
  Proc.new do
    drop_column :rate_limits, :maps_analysis_catalog
  end
)
