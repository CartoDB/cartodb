require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    add_column :users, :user_render_timeout, :integer, null: true
    add_column :users, :database_render_timeout, :integer, null: true
  end,
  Proc.new do
    drop_column :users, :user_render_timeout
    drop_column :users, :database_render_timeout
  end
)
