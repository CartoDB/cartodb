require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    # The 0 value means: "apply default export timeout" (defined by the SQL API)
    add_column :users, :export_timeout, :integer, default: 0, null: false
  end,
  Proc.new do
    drop_column :users, :export_timeout
  end
)
