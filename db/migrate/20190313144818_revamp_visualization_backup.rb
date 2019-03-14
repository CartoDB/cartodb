require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    run "TRUNCATE TABLE visualization_backups"

    run "ALTER TABLE visualization_backups DROP CONSTRAINT visualization_backups_pkey"
    drop_column :visualization_backups, :export_vizjson

    add_column :visualization_backups, :id, :uuid, default: Sequel.lit('uuid_generate_v4()'), null: false
    add_column :visualization_backups, :export, JSON, null: false
    add_column :visualization_backups, :type, String, null: false
    run "ALTER TABLE visualization_backups ADD PRIMARY KEY (id)"
  end,
  Proc.new do
    run "ALTER TABLE visualization_backups DROP CONSTRAINT visualization_backups_pkey"
    drop_column :visualization_backups, :id
    drop_column :visualization_backups, :export
    drop_column :visualization_backups, :type

    add_column :visualization_backups, :export_vizjson, String, null: false
    run "ALTER TABLE visualization_backups ADD PRIMARY KEY (visualization)"
  end
)
