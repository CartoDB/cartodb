require 'carto/db/migration_helper'

# rubocop:disable Style/MixinUsage
include Carto::Db::MigrationHelper
# rubocop:enable Style/MixinUsage

migration(
  proc do
    # The 0 value means: "apply default export timeout" (defined by the SQL API)
    add_column :users, :export_timeout, :integer, default: 0, null: false
  end,
  proc do
    drop_column :users, :export_timeout
  end
)
