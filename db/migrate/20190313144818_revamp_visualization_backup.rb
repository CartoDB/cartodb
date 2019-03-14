require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    drop_table :visualization_backups
  end,
  Proc.new do
    create_table :visualization_backups do
      String    :username,        null: false
      Uuid      :visualization,   null: false, primary_key: true
      String    :export_vizjson,  null: false
      DateTime  :created_at,      default: Sequel::CURRENT_TIMESTAMP
    end
  end
)

