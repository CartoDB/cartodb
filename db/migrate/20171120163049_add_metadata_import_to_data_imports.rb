require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :data_imports, :carto_gpkg_metadata, :text
  end,
  Proc.new do
    drop_column :data_imports, :carto_gpkg_metadata
  end
)

