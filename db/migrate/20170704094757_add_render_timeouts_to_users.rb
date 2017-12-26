require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    # The 0 value means: "apply default render timeouts" (defined by the tiler)
    add_column :users, :user_render_timeout, :integer, default: 0, null: false
    add_column :users, :database_render_timeout, :integer, default: 0, null: false
  end,
  Proc.new do
    drop_column :users, :user_render_timeout
    drop_column :users, :database_render_timeout
  end
)
