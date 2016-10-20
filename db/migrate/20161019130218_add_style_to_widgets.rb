require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    alter_table :widgets do
      add_column :style, :json, null: true
    end
  end,
  Proc.new do
    alter_table :widgets do
      drop_column :style
    end
  end
)
